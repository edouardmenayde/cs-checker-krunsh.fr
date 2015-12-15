imports.searchPath.push(imports.ui.appletManager.appletMeta["cs-checker-krunsh.fr"].path);

const MainLoop = imports.mainloop;
const Lang = imports.lang;

const Applet = imports.ui.applet;
const Soup = imports.gi.Soup;

const APPLET_ICON_DISCONNECTED = imports.ui.appletManager.appletMeta['cs-checker-krunsh.fr'].path + '/images/not-connected.png';
const APPLET_ICON_CONNECTED = imports.ui.appletManager.appletMeta["cs-checker-krunsh.fr"].path + '/images/connected.png';

const _httpSession = new Soup.SessionAsync();
Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

function MyApplet (orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function (orientation, panel_height, instance_id) {
        Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        this.set_applet_tooltip(_("Click to check status !"));
        this.set_applet_icon_path(APPLET_ICON_DISCONNECTED);

        this.settings = {
          interval: 60000
        };

        try {
            this.checkStatus();
        }
        catch (e) {
            global.logError(e);
        }
    },

    checkStatus: function () {
        let context = this;
        let statusMessage = Soup.Message.new('GET', 'https://cryptostorm.is/test');
        _httpSession.queue_message(statusMessage, function SoupQueue(session, message) {
            var isConnected = message.response_body.data.indexOf("favicon-yes.ico");
            if (isConnected != -1) {
                context.set_applet_icon_path(APPLET_ICON_CONNECTED);
            }
            else {
                context.set_applet_icon_path(APPLET_ICON_DISCONNECTED);
            }
        })
        this.updateCheckStatusTimeout();
    },

    updateCheckStatusTimeout: function () {
        if (this.timeout) {
            this.removeCheckStatusTimeout();
        }
        this.timeout = MainLoop.timeout_add(this.settings.interval, Lang.bind(this, this.onCheckStatusTime));
    },

    removeCheckStatusTimeout: function () {
        MainLoop.source_remove(this.timeout);
    },

    onCheckStatusTime: function () {
        this.checkStatus();
    },

    on_applet_clicked: function () {
        this.removeCheckStatusTimeout();
        this.checkStatus()
    },

    on_applet_removed_from_panel: function () {
        this.removeCheckStatusTimeout();
    }
};

function main (metadata, orientation, panel_height, instance_id) {
    return new MyApplet(orientation, panel_height, instance_id);
}
