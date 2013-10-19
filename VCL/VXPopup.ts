/// <reference path="Scripts/bootstrap.d.ts" />
import V = require("VCL/VCL");
import VXC = require("VCL/VXContainer");
import VXDS = require("VCL/VXServer");
import VXD = require("VCL/VXDataset");
import VXU = require("VCL/VXUtils");

export class VXPopup extends VXC.VXContainer {
    public onCreate() { }

    public onClosed: () => void;
    private jBody: JQuery;

    private _popupplacement: V.PopupPlacement = V.PopupPlacement.Right;
    public get PopupPlacement(): V.PopupPlacement {
        return this._popupplacement;
    }
    public set PopupPlacement(val: V.PopupPlacement) {
        if (val != this._popupplacement) {
            this._popupplacement = val;
            this.draw(false);
        }
    }

    private _title: string;
    public get Title(): string {
        return this._title;
    }
    public set Title(val: string) {
        if (val != this._title) {
            this._title = val;
            this.draw(false);
        }
    }


    constructor() {
        super(null, null);
        this.Width = 520; //bootstrap span5 as default

        var htmlFileName = this.getClassName();
        //TODO: need to support path
        var x = new VXDS.VXServer(false);
        x.getHTML(htmlFileName + ".html",
            (htmlFile: any) => {
                this.jComponent.html(htmlFile);
                if (this.onCreate != null) (V.tryAndCatch(() => { this.onCreate(); }))
            },
            (errorMessage: string) => {
                V.Application.raiseException(errorMessage);
            }
            );
    }

    private target: V.TComponent;
    public popup(target: V.TComponent) {
        if (target.jComponent == null) return;
        this.target = target;
        super.draw(true);

        target.jComponent.clickover({
            template: '<div class="popover popover2"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>',
            html: true, title: this.Title, content: this.jComponent.html(),
            placement: V.PopupPlacement[this.PopupPlacement]
        });
        target.jComponent.clickover("show");
    }

    public close() {
        //this.$popover.popover("destroy");
        if (this.onClosed != null) { (V.tryAndCatch(() => { this.onClosed(); })) }
    }

  
    public get isPage(): boolean {
        return true;
    }

}


var Clickover = function (element, options) {
    // local init
    this.cinit('clickover', element, options);
}

   Clickover.prototype = $.extend({}, $.fn.popover.Constructor.prototype, {

    constructor: Clickover

    , cinit: function (type, element, options) {
        this.attr = {};

        // choose random attrs instead of timestamp ones
        this.attr.me = ((Math.random() * 10) + "").replace(/\D/g, '');
        this.attr.click_event_ns = "click." + this.attr.me + " touchstart." + this.attr.me;

        if (!options) options = {};

        options.trigger = 'manual';

        // call parent
        this.init(type, element, options);

        // setup our own handlers
        this.$element.on('click', this.options.selector, $.proxy(this.clickery, this));

        // soon add click hanlder to body to close this element
        // will need custom handler inside here
    }
    , clickery: function (e) {
        // clickery isn't only run by event handlers can be called by timeout or manually
        // only run our click handler and  
        // need to stop progration or body click handler would fire right away
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // set popover's dim's
        this.options.width && this.tip().width(this.options.width);
        this.options.height && this.tip().height(this.options.height);

        // set popover's tip 'id' for greater control of rendering or css rules
        this.options.tip_id && this.tip().attr('id', this.options.tip_id);

        // add a custom class
        this.options.class_name && this.tip().addClass(this.options.class_name);

        // we could override this to provide show and hide hooks 
        this[this.isShown() ? 'hide' : 'show']();

        // if shown add global click closer
        if (this.isShown()) {
            var that = this;

            // close on global request, exclude clicks inside clickover
            this.options.global_close &&
            $('body').on(this.attr.click_event_ns, function (e) {
                if (!that.tip().has(e.target).length) { that.clickery(); }
            });

            this.options.esc_close && $(document).bind('keyup.clickery', function (e) {
                if (e.keyCode == 27) { that.clickery(); }
                return;
            });

            // first check for others that might be open
            // wanted to use 'click' but might accidently trigger other custom click handlers
            // on clickover elements 
            !this.options.allow_multiple &&
            $('[data-clickover-open=1]').each(function () {
                $(this).data('clickover') && $(this).data('clickover').clickery();
            });

            // help us track elements w/ open clickovers using html5
            this.$element.attr('data-clickover-open', 1);

            // if element has close button then make that work, like to
            // add option close_selector
            this.tip().on('click', '[data-dismiss="clickover"]', $.proxy(this.clickery, this));

            // trigger timeout hide
            if (this.options.auto_close && this.options.auto_close > 0) {
                this.attr.tid =
                setTimeout($.proxy(this.clickery, this), this.options.auto_close);
            }

            // provide callback hooks for post shown event
            typeof this.options.onShown == 'function' && this.options.onShown.call(this);
            this.$element.trigger('shown');
        }
        else {
            this.$element.removeAttr('data-clickover-open');

            this.options.esc_close && $(document).unbind('keyup.clickery');

            $('body').off(this.attr.click_event_ns);

            if (typeof this.attr.tid == "number") {
                clearTimeout(this.attr.tid);
                delete this.attr.tid;
            }

            // provide some callback hooks
            typeof this.options.onHidden == 'function' && this.options.onHidden.call(this);
            this.$element.trigger('hidden');
        }
    }
    , isShown: function () {
        return this.tip().hasClass('in');
    }
    , resetPosition: function () {
        var $tip
            , inside
            , pos
            , actualWidth
            , actualHeight
            , placement
            , tp

      if (this.hasContent() && this.enabled) {
            $tip = this.tip()

        placement = typeof this.options.placement == 'function' ?
            this.options.placement.call(this, $tip[0], this.$element[0]) :
            this.options.placement

        inside = /in/.test(placement)

        pos = this.getPosition(inside)

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (inside ? placement.split(' ')[1] : placement) {
                case 'bottom':
                    tp = { top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2 }
            break
          case 'top':
                    tp = { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 }
            break
          case 'left':
                    tp = { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth }
            break
          case 'right':
                    tp = { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }
            break
        }

            $tip.css(tp)
      }
    }
    , debughide: function () {
        var dt = new Date().toString();
        this.hide();
    }
})

  /* plugin definition */
  /* stolen from bootstrap tooltip.js */
  $.fn.clickover = function (option) {
    return this.each(function () {
        var $this = $(this)
            , data = $this.data('clickover')
            , options = typeof option == 'object' && option

      if (!data) $this.data('clickover', (data = new Clickover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.clickover.Constructor = Clickover

  // these defaults are passed directly to parent classes
  $.fn.clickover.defaults = $.extend({}, $.fn.popover.defaults, {
    trigger: 'manual',
    auto_close: 0, /* ms to auto close clickover, 0 means none */
    global_close: 1, /* allow close when clicked away from clickover */
    esc_close: 1, /* allow clickover to close when esc key is pressed */
    onShown: null,  /* function to be run once clickover has been shown */
    onHidden: null,  /* function to be run once clickover has been hidden */
    width: null, /* number is px (don't add px), null or 0 - don't set anything */
    height: null, /* number is px (don't add px), null or 0 - don't set anything */
    tip_id: null,  /* id of popover container */
    class_name: 'clickover', /* default class name in addition to other classes */
    allow_multiple: 0 /* enable to allow for multiple clickovers to be open at the same time */
})
