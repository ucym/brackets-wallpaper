/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, window, $, document */

define(function (require, exports, module) {
    "use strict";
    
    // Imports
    var PreferencesManager      = brackets.getModule("preferences/PreferencesManager");
    
    // Define Const
    var PREFERENCES_KEY     = "com.adobe.brackets.brackets-wallpaper",
        DEFAULT_PREF        = {
            enabled:    true,
            image:      null,
            position:   "left top",
            repeatType: "repeat",
            filters:    ["whitefilm"],
            
            version:    "1.1"
        },
        KEYS                = {
            ENABLED: "enabled",
            IMAGE: "image",
            POSITION: "position",
            REPEAT_TYPE: "repeatType",
            FILTERS: "filters"
        };
    
    // Define Variables
    var prefs       = PreferencesManager.getPreferenceStorage(PREFERENCES_KEY, DEFAULT_PREF);
    
    // Define Function
    function realTypeOf(obj) { return Object.prototype.toString.apply(obj).slice(8, -1).toLowerCase(); }
    
    function _unloadAll() {
        var keys = prefs.getAllValues();
        
        $.each(keys, function (k, v) {
            prefs.remove(k);
        });
    }
    
    function _enabled(state) {
        if (state !== undefined) {
            prefs.setValue(KEYS.ENABLED, !!state);
        }
        
        return prefs.getValue(KEYS.ENABLED);
    }
    
    function _image(image) {
        if (typeof image === "string") {
            image = image.replace(/\\/g, "/"); // replace "¥" for Windows
            prefs.setValue(KEYS.IMAGE, image);
        }
        
        return prefs.getValue(KEYS.IMAGE);
    }
    
    function _position(position) {
        if (typeof position === "string") {
            prefs.setValue(KEYS.POSITION, position);
        }
        
        return prefs.getValue(KEYS.POSITION);
    }
    
    function _repeatType(repeatType) {
        if (typeof repeatType === "string") {
            prefs.setValue(KEYS.REPEAT_TYPE, repeatType);
        }
        
        return prefs.getValue(KEYS.REPEAT_TYPE);
    }
        
    function _filters(filters) {
        if (realTypeOf(filters) === "array") {
            prefs.setValue(KEYS.FILTERS, filters);
        } else if (arguments.length !== 0) {
            prefs.setValue(KEYS.FILTERS, arguments);
        }
        
        return prefs.getValue(KEYS.FILTERS);
    }
    
    exports.unload      = _unloadAll;
    exports.enabled     = _enabled;
    exports.image       = _image;
    exports.position    = _position;
    exports.repeatType  = _repeatType;
    exports.filters     = _filters;
    
    // convert old preference to new preferences
    try {
        var old = window.localStorage.getItem("glowls.wp.config");
        
        if (old) {
            old = JSON.parse(old);
            
            _image(old.imagePath);
            _position(old.imagePosition);
            _enabled(old.enebled);
            _filters(old.enabledFilters);
            _repeatType(old.imageRepeat);
            
            window.localStorage.removeItem("glowls.wp.config");
            window.localStorage.removeItem("growls.wp.config"); // unsupported old type
        }
    } catch (e) {}
});