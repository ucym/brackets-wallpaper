/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, window, $, brackets, Mustache */
define(function (require, exports, module) {
    "use strict";
    
    // Imports
    var NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        CommandManager      = brackets.getModule("command/CommandManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Menus               = brackets.getModule("command/Menus"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        
        ModelPreferences    = require("ModelPreferences");
    
    
    // Define Const
    var PREFERENCES_KEY = "com.adobe.brackets.brackets-wallpaper",
        MOD_PREF = "brackets-wallpaper",
        NAMESPACE = "brackets.wallpaper",
        
        COMMAND_PREF = (NAMESPACE + ".command");
        
    
    // Define Variables
    var tmplPreference  = {
            _tmpl:      Mustache.compile(require("text!html/preference.html")),
            compile:    function () {
                var $p = $(this._tmpl(ModelPreferences)),
                    mp = ModelPreferences;
                
                // Show file selector
                $p.on("click", "[data-action='fileSelect']", function () {
                    /* Memo:
                        1:Allow multi select, 2:Choose directories, 3:title
                        4:initialPath, 5:fileTypes, 6:success, 7:error
                    **/
                    NativeFileSystem
                        .showOpenDialog(false, false, "choose wallpaper", null, ["png", "jpg", "jpeg"],
                            function (paths) {
                                if (paths.length > 0) {
                                    $("input[name='image']").val(paths[0]);
                                }
                            });
                        
                    return false;
                });
                
                // apply selected position
                $p.find(".posSelector input").filter("[value='" + mp.position() + "']")[0].checked = true;
                
                // apply filter type
                var filterChecks = $p.find("input[name='filters']");
                $.each(mp.filters(), function (k, v) {
                    try {
                        filterChecks.filter("[value='" + v + "']")[0].checked = true;
                    } catch (e) {}
                });
                
                // apply repeatType
                try {
                    $p.find("select[name='repeatType']").find("option[value='" + mp.repeatType() + "']")[0].selected = true;
                } catch (e) {}
                
                return $p;
            }
        },
        tmplWallpaper   = {
            _tmpl:      Mustache.compile(require("text!html/wallpaper.html")),
            compile:    function () {
                var $wp = $(this._tmpl(ModelPreferences)),
                    mp = ModelPreferences;
                
                $wp.toggleClass("brackets-wp-active", mp.enabled());
                
                var fxDom = $wp.find("[data-fxid]");
                $.each(mp.filters(), function (k, v) {
                    fxDom.filter("[data-fxid='" + v + "']").attr("data-fx-active", "");
                });
                
                return $wp;
            }
        },
        
        $pref           = null,
        $wp             = null;
    
    
    // Define Functions
    function initialize() {
        if ($pref !== null) {
            $pref.remove();
            $pref = null;
        }
        
        if ($wp !== null) {
            $wp.remove();
            $pref = null;
        }
        
        $pref = tmplPreference.compile();
        $wp = tmplWallpaper.compile();
        
        $wp.prependTo("#editor-holder");
        
        if (ModelPreferences.enabled()) {
            $("#editor-holder").attr("brackets-wp-active", "");
        } else {
            $("#editor-holder").removeAttr("brackets-wp-active");
        }
    }
    
    function enableStateChange() {
        if (ModelPreferences.enabled()) {
            $("#editor-holder").attr("brackets-wp-active", "");
        } else {
            $("#editor-holder").removeAttr("brackets-wp-active");
        }
        
        $wp.toggleClass("brackets-wp-active", ModelPreferences.enabled());
    }
    
    function savePreference() {
        // parse input preferences
        var plain = $pref.find("form").serializeArray(),
            parsed = {};
            
        plain.forEach(function (elem) {
            parsed[elem.name] = parsed[elem.name] || [];
            parsed[elem.name].push(elem.value);
        });
        
        $.each(parsed, function (k, v) {
            try { ModelPreferences[k].apply(ModelPreferences, v); } catch (e) {}
        });
        
        initialize();
    }
    
    function closePreference(result) {
        if (result === "save") {
            savePreference();
        } else if (result === "cancel") {
            $pref = tmplPreference.compile();
        }
    }
    
    
    initialize();
    
    
    // Register Menu
    CommandManager.register("Wallpaper Preferences", COMMAND_PREF + ".preference", function () {
        var dialog = Dialogs.showModalDialogUsingTemplate($pref);
        
        dialog.done(closePreference);
    });
    
    CommandManager.register("Enable Wallpaper", COMMAND_PREF + ".enebled", function () {
        this.setChecked(ModelPreferences.enabled(!this.getChecked()));
        
        enableStateChange();
    }).setChecked(ModelPreferences.enabled());
    
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COMMAND_PREF + ".preference");
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(COMMAND_PREF + ".enebled");
    
    
    // Load CSS
    ExtensionUtils.loadStyleSheet(module, "css/Wallpaper.css");
    ExtensionUtils.loadStyleSheet(module, "css/Overrides.css");
    
    /*
     * Will load GPU Enable CSS if brackets newer than sprint 27.
     * (May display glitching in sprint 26.)
     **/
    try {
        if (parseInt(brackets.metadata.apiVersion.split(".")[1], 10) >= 27) {
            ExtensionUtils.loadStyleSheet(module, "css/Accelerator.css");
        }
    } catch (e) {}
    
    exports.unload = function () {
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(COMMAND_PREF + ".preference");
        Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).removeMenuItem(COMMAND_PREF + ".enebled");
        
        if ($pref !== null) {
            $pref.remove();
            $pref = null;
        }
        
        if ($wp !== null) {
            $wp.remove();
            $pref = null;
        }
    };
});