define(function (require, exports, module) {
    "use strict";
    
    /**
     *  Module informations
     */
    var MOD_PREF = "growls-wp",
        NAMESPACE = "glowls.wp",
        
        STORAGE_NAMESPACE = (NAMESPACE + ".config"),
        COMMAND_NAMESPACE = (NAMESPACE + ".command");
    
    /**
     *  Import modules
     */
    var NativeFileSystem    = brackets.getModule("file/NativeFileSystem").NativeFileSystem,
        CommandManager      = brackets.getModule("command/CommandManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Menus               = brackets.getModule("command/Menus"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs      = brackets.getModule("widgets/DefaultDialogs");
    
    /**
     *  Load HTML templates
     */
    // Load styles
    var styleSource         = require("text!css/Overrides.css"),
        $style              = $("<style>"),
    
    // Wallpaper containers
        wpLayers            = require("text!html/wallpaperLayer.html"),
        $container          = null,
    
    // Dialog templetes
        dialogTmpl          = require("text!html/dialog.html"),
        $dialog             = null;
    
    // Load CSS
    ExtensionUtils.loadStyleSheet(module, "css/Wallpaper.css");
    
    /*
     * Will load GPU Enable CSS if brackets newer than sprint 27.
     * (May display glitching in version 27 or less.)
     **/
    try {
        if (parseInt(brackets.metadata.apiVersion.split(".")[1], 10) >= 27) {
            ExtensionUtils.loadStyleSheet(module, "css/Accelerator.css");
        }
    } catch (e) {}
    
    /**
     *  Load configure
     */
    var _plainConfig;
    
    try {
        _plainConfig = JSON.parse(localStorage.getItem(STORAGE_NAMESPACE));
    } catch (e) {
        console.error(MOD_PREF + ": cannot read configure", e);
    } finally {
        _plainConfig = _plainConfig || {};
    }
    
    // configure
    var _config = {
        _isValid: function () {
            var state = (_plainConfig != null);
            
            if (state === false) {
                _plainConfig = {};
                this._save();
                console.error(MOD_PREF + ": Cannot readed configure.");
            }
            
            return state;
        },
        
        _save: function () {
            try {
                localStorage.setItem(STORAGE_NAMESPACE, JSON.stringify(_plainConfig));
            } catch (e) {
                console.error(MOD_PREF + ": Missing save configure", e);
            }
        },
        
        enable: function (state) {
            if (this._isValid() !== true) return;
                
            if (state != null) {
                _plainConfig.enable = !!state;
            } else {
                return (_plainConfig.enable == null ? true : !!_plainConfig.enable);
            }
        },
        
        wallpaper: function (path) {
            if (this._isValid() !== true) return;
            
            if (path != null) {
                path = path.replace(/\\/g, "/");
                _plainConfig.imagePath = path;
            } else {
                var path = _plainConfig.imagePath;
                
                if (path != null) {
                    path = path.replace(/\\/g, "/");
                }
                
                return path;
            }
        },
        
        imagePosition: function (pos) {
            if (this._isValid() !== true) return;
            
            if (pos != null && typeof pos === "string" && pos.split(" ").length === 2) {
                _plainConfig.imagePosition = pos;
            } else {
                return _plainConfig.imagePosition || "initial";
            }
        },
        
        imageRepeat: function (repeat) {
            if (this._isValid() !== true) return;
            
            if (repeat != null && typeof repeat === "string") {
                _plainConfig.imageRepeat = repeat;
            } else {
                return _plainConfig.imageRepeat || "no-repeat";
            }
        },
        
        enabledFilters: function (filters) {
            if (this._isValid() !== true) return;
            
            if (filters != null && Object.prototype.toString.call(filters).slice(8, -1) === "Array") {
                _plainConfig.enabledFilters = filters;
            } else {
                return _plainConfig.enabledFilters || [];
            }
        }
    };
    
    /**
     *  define dialog events
     */
    var _dialogEvents = {
        initialize: function () {
            $dialog
                .on("click", "#growls-wp-c-fileselector button", _dialogEvents.startFileSelect)
                .on("click", "#growls-wp-c-posselector input", _dialogEvents.imagePositionSelected);
            
            // image attached position
            $dialog
                .find("#growls-wp-c-posselector input")
                .filter("[value='" + _config.imagePosition() + "']")
                .attr("checked", true);
            
            // Enabled filters
            var filterCheckers = $dialog.find("#growls-wp-c-filterselector input");
            _config.enabledFilters().forEach(function(cls) {
                filterCheckers.filter("[value='" + cls + "']").attr("checked", true);
            });
            
            // Image repeat type
            $dialog
                .find("#growls-wp-c-repeattype input")
                .filter("[value='" + _config.imageRepeat() + "']")
                .attr("checked", true);
        },
        startFileSelect: function () {
            // 1:Allow multi select, 2:Choose directories, 3:title
            // 4:initialPath, 5:fileTypes, 6:success, 7:error
            NativeFileSystem.showOpenDialog(false, false, "choose wallpaper",
                                            null, ["png","jpg","jpeg"], _dialogEvents.fileSelected);
        },
        
        fileSelected: function (paths) {
            if (paths.length > 0) {
                $("#growls-wp-c-selectedfile", $dialog).val(paths[0]);
            }
            return false;
        },
        
        imagePositionSelected: function () {
            
        },
        
        closed: function (result) {
            if (result === "save") {
                
                var wallpaperURL = $dialog.find("#growls-wp-c-selectedfile").val();
                _config.wallpaper(wallpaperURL);
                
                var wallpaperAttachPosition = $dialog.find("#growls-wp-c-posselector input:checked").val();
                _config.imagePosition(wallpaperAttachPosition);
                
                var classes = [];
                $dialog.find("#growls-wp-c-filterselector input:checked").each(function () {
                    classes.push($(this).val());
                });
                _config.enabledFilters(classes);
                
                var repeatType = $dialog.find("#growls-wp-c-repeattype input:checked").val();
                _config.imageRepeat(repeatType);
                
                _config._save();
            }
            
            _initialize();
        }
    };
    
    
    function _initialize() {
        try {
            // remove old elements
            if ($style != null) {
                $style.remove();
            }
            
            if ($container != null) {
                $container.remove();
                $container = null;
            }
            
            if ($dialog != null) {
                $dialog.remove();
                $dialog = null;
            }
            
            // Load configure dialog
            $dialog = $(Mustache.render(dialogTmpl, _config));
            _dialogEvents.initialize();
            
            if (_config.enable() === true) {
                // Load style (force override)
                $style.text(styleSource).appendTo("head");
                
                // Load wallpaper layer
                $container = $(Mustache.render(wpLayers, _config)).prependTo("#editor-holder");
                
                // Enable filter
                _config.enabledFilters().forEach(function (cls) {
                    $("." + cls, $container).attr("data-wp-fx-enable", "a");
                });
            }
        } catch (e) {
            console.error(MOD_PREF + ": initialize error", e);
        }
    }
    
    _initialize();
    
    
    /**
     *  Register Menu
     */
    var commandId = {
        wallpaperConfig: (COMMAND_NAMESPACE + ".config"),
        wallpaperEnable: (COMMAND_NAMESPACE + ".enabled")
    }
    
    CommandManager.register("Wallpaper config", commandId.wallpaperConfig, function () {
       var dialog = Dialogs.showModalDialogUsingTemplate($dialog);
       
       dialog.done(_dialogEvents.closed);
    });
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(commandId.wallpaperConfig);
    
    CommandManager.register("Enable Wallpaper", commandId.wallpaperEnable, function () {
        var state;
        this.setChecked(state = !this.getChecked());
        
        _config.enable(state);
        _config._save();
        _initialize();
    }).setChecked(_config.enable());
    Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(commandId.wallpaperEnable);
});