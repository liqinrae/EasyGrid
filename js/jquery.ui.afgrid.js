// afGrid
// A lightweight JQuery grid plugin

//Core
$.widget("ui.afGrid", $.ui.afGrid, {

    // Default options.
    options: {
        altRows: true, // sets a zebra-striped grid
        //caption: '',
        colModel: [],
        dataType: 'JSON', // JSON or clientSide (data defined as array on client side)
        height: '150px',
        imgPath: '../images/',
        loadOnce: false,
        localData: {},
        mode: 'GET',
        pageSize: 15,
        postData: {}, // name: value pairs format
        showPager: true,
        shrinkToFit: true,
        url: null,
        viewRecords: false,
        emptyRecordsText: 'No entries to view',
        width: '',
        sortOrder : 'asc',
        sortBy: null
    },

    classSelectors: {
        gridContainer: 'afgrid',
        //caption: 'afgrid-caption',
        table: 'afgrid-table',
        gridHeader: 'afgrid-grid-header',
        headerRow: 'afgrid-header-row',
        headerCell: 'afgrid-header-cell',
        gridBody: 'afgrid-grid-body',
        bodyRow: 'afgrid-row',
        bodyAltRow: 'afgrid-alt-row',
        bodyCell: 'afgrid-cell',
        pager: 'afgrid-pager',
        pagerNav: 'afgrid-pager-nav',
        pagerNavButton: 'afgrid-pager-nav-button',
        pagerRecords: 'afgrid-pager-records',
        pagerPage: 'afgrid-pager-page',
        loadContainer: 'afgrid-load-container',

        currentPage: 'afgrid-pager-currentpage',
        disabledPage: 'afgrid-page-disabled',
        headerScrollbar: 'afgrid-header-scrollbar',
        noRecords: 'afgrid-grid-body-no-records',
        showlink: 'afgrid-table-link',
        overlay: 'afgrid-overlay',
        loader: 'afgrid-load',
        sortable: 'afgrid-sortable',
        arrowUp: 'ui-icon-caret-1-n',
        arrowDown: 'ui-icon-caret-1-s',
        uiIcon: 'ui-icon'
    },

    _setOption: function (key, value) {
        this._super(key, value);
    },

    _setOptions: function (options) {
        this._super(options);
    },

    // Constructor
    _create: function () {
        this.element.addClass(this.classSelectors.gridContainer);
        this.element.append(this._createLoader());

        // private properties
        this._id = null;
        this._curpage = 1;
        this._pages = 0;
        this._records = 0;
        this._startPage = 1;
        
        //constants
        this._MAX_CONSECUTIVE_PAGE_NAV_BTNS = 3;

        this._createGrid();
        this._addEventHandlers();
    },

    _createLoader: function () {
        var loadingContainer = this._newElement("div", this.classSelectors.overlay);
        var loader = this._newElement("div", this.classSelectors.loader);
        var img = this._newElement("img", null);
        img.attr('src', this.options.imgPath + 'defaultLoader.gif');
        loader.append(img);
        loadingContainer.append(loader);
        return loadingContainer;
    },

    _createGrid: function () {

        //configure grid header
        this.element.append(this._createHeader());

        //configure grid body
        this.element.append(this._createBody());

        //configure grid pager
        if (this.options.showPager || this.options.viewRecords)
            this.element.append(this._createPager());

        if (this.options.dataType.toLowerCase() == 'clientside') {
            this._records = this.options.localData && this.options.localData.records ? this.options.localData.records : 0;
            this._pages = this._records > 0 ? Math.ceil(this._records / this.options.pageSize) : 0;
        }

        this._adjustLoader();
        this._resizeGrid();

        //$(".afgrid-overlay").css("display", "block");

        this._getGridData();

        /*setTimeout(function () {
            $(".afgrid-overlay").css("display", "none");
        }, 1000);*/
    },

    _createHeader: function () {
        var header = this._newElement("div", this.classSelectors.gridHeader);
        var table = this._newElement("table", this.classSelectors.table);
        var tbody = this._newElement("tbody", null);
        var row = this._newElement("tr", this.classSelectors.headerRow);
        var content = '';

        var _this = this;
        $.each(this.options.colModel, function (index, value) {
            var cell = _this._newElement("th", _this.classSelectors.headerCell);
            var ic = _this._newElement('span', _this.classSelectors.uiIcon);

            cell.append(ic);
            
            var sortable = value.sortable !== undefined && value.sortable !== null && value.sortable !== ''? value.sortable : true;

            if (sortable == true) {
                _this._addSortingEvent(cell, value);
            }

            if (value.key && !_this._id) _this._id = value.name;

            var label = value.label;
            if (!label || label == '') label = value.name;
            cell.html(label);

            if (!value.width) value.width = 150;
            cell.css('width', value.width + 'px');

            if (value.hidden) cell.hide();

            row.append(cell);
        });

        tbody.append(row);
        table.append(tbody);
        header.append(table);

        return header;
    },

    _getGridData: function () {
        var _this = this;
        var dataType = this.options.dataType.toLowerCase();

        switch (dataType) {
            case "json":
                var postData = this.options.postData;
                postData.page = this._curpage;
                postData.pageSize = this.options.pageSize;

                if (_this.options.sortBy) {
                    postData.sortBy = this.options.sortBy;
                    postData.sortOrder = this.options.sortOrder;
                }

                $.ajax({
                    type: _this.options.mode,
                    url: _this.options.url,
                    dataType: 'json',
                    data: postData,
                    beforeSend: function (xhr, settings) {
                        _this._blockUI();
                        _this._trigger('onLoadBeforeSend', null, [xhr]);
                    },
                    success: function (data) {
                        console.log(data);

                        _this._curpage = data && data.page ? data.page : 0;
                        _this._records = data && data.records ? data.records : 0;
                        _this._pages = data.records > 0 ? Math.ceil(_this._records / _this.options.pageSize) : 0;

                        _this._loadGrid(data, dataType);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        _this._trigger('onLoadError', null, [xhr, textStatus, errorThrown]);
                    },
                    complete: function () {
                        _this._unblockUI();
                    }
                });
                break;
            case "clientside":
                if (_this.options.sortBy != null){
                    var thname = this.options.sortBy, order = _this.options.sortOrder, formatter = _this._getColProperties(thname).formatter;
                    this.options.localData.data.sort(function (a, b) { 
                        var aName = a[thname];
                        var bName = b[thname];
                        return _this._formatterSorting(aName, bName, order, formatter)
                    });
                }

                this._loadGrid(this.options.localData, dataType);

                setTimeout(function () {
                    _this.element.find('.' + _this.classSelectors.overlay).css("display", "none");
                }, 1000);

                break;

        }
    },

    _loadGrid: function (data, dataType) {
        var _this = this;

        if (this.options.loadOnce && dataType.toLowerCase() == 'json') {
            this.options.localData = data;
            this.options.loadOnce = false;
            this.options.dataType = 'clientSide';
        }

        if (this._records == 0) {
            var emptyRecordsDiv = this._getEmptyRecordsDiv();
            this.element.find('.' + this.classSelectors.gridBody).html(emptyRecordsDiv);
        }
        else if ($.isArray(data.data)) {
            var table = this._newElement("table", this.classSelectors.table);
            var tbody = this._newElement("tbody", null);

            var pagedData = _this._getSubsetData(data.data, this._curpage, this.options.pageSize);

            $.each(pagedData, function (i, row) {
                var trClass = (i % 2 == 0) ? _this.classSelectors.bodyRow : _this.classSelectors.bodyAltRow;
                var tr = _this._newElement("tr", trClass);
                var rowId = i;

                $.each(row, function (key, value) {
                    var td = _this._newElement("td", _this.classSelectors.bodyCell);
                    var colModel = _this._getColProperties(key);

                    if (colModel.formatter !== undefined){
                        if ($.isFunction(colModel.formatter)){
                            var opts = { rowId: rowId, colModel: colModel, rowData: row};
                            value = colModel.formatter.call(colModel.formatter, value, opts);
                        } 
                        else {
                            value = _this._formatter(colModel, value);
                        }
                    }

                    if (key == _this._id) tr.attr('data-id', value);
                    if (colModel && colModel.hidden) td.hide();
                    td.css("width", colModel.width + 'px');

                    td.html(value);
                    tr.append(td);
                });

                //assign default id of index + 1
                var id = tr.attr('data-id');
                if (typeof id === typeof undefined || id === false)
                    tr.attr('data-id', i + 1);

                tbody.append(tr);
            });

            table.append(tbody);
            this.element.find('.' + this.classSelectors.gridBody).html(table);
        }

        this._updatePager();
        this._resizeGrid();

        this._trigger('onLoadComplete', null, []);
    },

    _createBody: function () {
        var body = this._newElement("div", this.classSelectors.gridBody);
        body.append(this._getEmptyRecordsDiv());
        return body;
    },

    _createPager: function () {
        var pager = this._newElement("div", this.classSelectors.pager);
        var table = this._newElement("table", this.classSelectors.table);
        var tbody = this._newElement("tbody", null);
        var row = this._newElement("tr", null);
        var cell = this._newElement("td", null);

        var pagerNav = this._newElement("ul", this.classSelectors.pagerNav);
        var pagerRecords = this._newElement("span", this.classSelectors.pagerRecords);

        if (this.options.viewRecords)
            pagerRecords.html(this.defaults.noRecordsText);

        cell.append(pagerRecords);
        cell.append(pagerNav);
        row.append(cell);
        tbody.append(row);
        table.append(tbody);
        pager.append(table);

        return pager;
    },

    _updatePager: function() {
        var pager = this.element.find('.' + this.classSelectors.pager);

        if (this._records <= 1
            || (!this.options.viewRecords && !this.options.showPager)) {
                pager.remove();
                return;
            }

        if (!pager.length
            && (this.options.viewRecords || this.options.showPager)) {
                this.element.append(this._createPager());
        }

        this._updatePagerRecordsText();
        this._updatePagerNav();
    },

    _updatePagerNav: function () {
        var pagerNav = this.element.find('.' + this.classSelectors.pagerNav);
        pagerNav.html('');

        if (!this.options.showPager || this._records < 1)
            return;

        var prevButton = this._createPageNavButton(this._curpage - 1, this.defaults.previousPageText);
        if (this._curpage == 1) prevButton.addClass(this.classSelectors.disabledPage);
        pagerNav.append(prevButton);

        if (this._startPage > 1) {
            
            var navButton = this._createPageNavButton(1, 1);
            pagerNav.append(navButton);

            var prevPage = this._startPage - 1;
            var navButton = this._createPageNavButton(prevPage, "...");
            pagerNav.append(navButton);
        }

        var endPage = Math.min(this._pages,this._startPage + this._MAX_CONSECUTIVE_PAGE_NAV_BTNS - 1);
        for (var i = this._startPage; i <= endPage; i++) {
            var navButton = this._createPageNavButton(i, i);
            if (i == this._curpage) navButton.addClass(this.classSelectors.currentPage);
            pagerNav.append(navButton);
        }

        if (endPage < this._pages) {
            var nextPage = endPage + 1;
            var navButton = this._createPageNavButton(nextPage, "...");
            pagerNav.append(navButton);

            var navButton = this._createPageNavButton(this._pages, this._pages);
            if (this._curpage == this._pages) navButton.addClass(this.classSelectors.disabledPage);            
            pagerNav.append(navButton);
        }

        var nextButton = this._createPageNavButton(this._curpage + 1, this.defaults.nextPageText);
        if (this._curpage == this._pages) nextButton.addClass(this.classSelectors.disabledPage);
        pagerNav.append(nextButton);
    },

    _updatePagerRecordsText: function() {
        var pagerRecords = this.element.find('.' + this.classSelectors.pagerRecords);
        pagerRecords.html('');

        if (!this.options.viewRecords)
            return;

        if (this._records > 0) {
            var start = ((this._curpage-1)*this.options.pageSize)+1;
            var end = Math.min(this._curpage*this.options.pageSize, this._records);
            var total = this._records;
            var recordsText = this._formatString(this.defaults.recordsText, [start, end, total])
            pagerRecords.html(recordsText);
        }
        else {
            pagerRecords.html(this.defaults.noRecordsText);
        }                                                                                                                                                                                                                                                                                                           
    },

    _createPageNavButton: function (pageNumber, text) {
        var _this = this;

        var page = this._newElement("li", this.classSelectors.pagerPage);
        var pageLink = this._newElement("a", null);
        pageLink.html(text);
        pageLink.attr('href', 'javascript:void();');

        page.on("click", function () {
            _this._goToPage(pageNumber);
        });

        page.append(pageLink);
        return page;
    },

    _goToPage: function (page) {

        if (page < 1) page = 1;
        if (page > this._pages) page = this._pages;

        if (page == this._curpage)
        return;

        this._startPage = (Math.ceil(page/this._MAX_CONSECUTIVE_PAGE_NAV_BTNS)*this._MAX_CONSECUTIVE_PAGE_NAV_BTNS) 
            - (this._MAX_CONSECUTIVE_PAGE_NAV_BTNS-1);

        this._curpage = page;
        this._getGridData();
    },

    _resizeGrid: function () {
        var headerEl = this.element.find('.' + this.classSelectors.gridHeader);

        //adjust table/column height
        this.element.css('height', this.options.height);

        if (this.options.height && this.options.height.toLowerCase().indexOf('auto') < 0)
            this._adjustBodyHeight();

        // adjust table width
        if (this.options.width && this.options.width != '')
            this.element.css('width', this.options.width);

        //adjust column width
        if (this.options.shrinkToFit) {
           this._adjustColWidths();
            if (this._hasHorizontalScrollbar(this.element.find('.'+this.classSelectors.gridBody)))
               this._adjustColWidths();
        }

        // scroll header with body
        if (this._hasVerticalScrollbar(this.element.find('.' + this.classSelectors.gridBody))) {
            headerEl.width(this.element.width() - this._getVerticalScrollbarWidth());
        }
        else {
            headerEl.width(this.element.width());
        }
    },

    _adjustBodyHeight: function () {
        var total = this.element.outerHeight();
        var header = this.element.find('.' + this.classSelectors.gridHeader).outerHeight();
        var pager = this.element.find('.' + this.classSelectors.pager).outerHeight();

        var bodyHeight = total - header - pager;
        this.element.find('.' + this.classSelectors.gridBody).css('height', bodyHeight + 'px');
    },

    _adjustColWidths: function () {
        var _this = this;
        var gridBody = this.element.find('.' + this.classSelectors.gridBody);

        var scrollbarWidth = this._hasVerticalScrollbar(gridBody) ? this._getVerticalScrollbarWidth() : 0;
        var tableWidth = gridBody.innerWidth() - scrollbarWidth;
        var remainingWidth = tableWidth;
        var newWidths = [];

        //header
        var headers = this.element.find('.' + this.classSelectors.headerCell + ':visible'); 
        var curTotalColWidth = $.map(headers,function(val){ return $(val).outerWidth(); }).reduce(function(a,b) { return a + b; });
       
        $.each(headers, function(index, header) {
            var curWidth = $(header).outerWidth();
            var newWidth = Math.floor((curWidth/curTotalColWidth) * tableWidth);
            var adjustedNewWidth = newWidth - ($(header).outerWidth() - $(header).width());

            if (index == headers.length)
            adjustedNewWidth = remainingWidth;

            $(header).width(adjustedNewWidth);
            remainingWidth -= adjustedNewWidth;
            newWidths.push(adjustedNewWidth);
        });

        //body
        var rows = this.element.find('.' + this.classSelectors.gridBody + ' tr');
        $.each(rows, function(index, row) {
            var cells = $(row).find('td:visible');
            $.each(cells, function(index, cell) {
                $(cell).width(newWidths[index]);
            });
        });

    },

    _adjustLoader: function () {
        var loadingContainer = this.element.find('.' + this.classSelectors.overlay);
        var img = this.element.find('.' + this.classSelectors.overlay + ' img');

        var bodyHeight = this.options.height;
        var bodyWidth = this.options.width;

        var headerHeight = this.element.find('.' + this.classSelectors.gridHeader).outerHeight();
        var pager = this.options.showPager || this.options.viewRecords ? this.element.find('.' + this.classSelectors.pager).outerHeight() : 0;

        var loaderHeight = parseInt(bodyHeight.substring(0, bodyHeight.length - 2)) - headerHeight - pager;
        var loaderWidth = parseInt(bodyWidth.substring(0, bodyWidth.length - 2));

        loadingContainer.css('height', loaderHeight);
        loadingContainer.css('width', loaderWidth);
        loadingContainer.css('top', headerHeight);


        img.css('margin-left',loaderWidth/2 - img.width());
        img.css('margin-top', loaderHeight/2 - img.height());


    },

    _getEmptyRecordsDiv: function() {
        var noRecordsDiv = this._newElement("div", this.classSelectors.noRecords);

        var text = this.options.emptyRecordsText ? this.options.emptyRecordsText : this.defaults.emptyRecordsText;
        noRecordsDiv.html(this.options.emptyRecordsText);
        return noRecordsDiv;
    },

    _addEventHandlers: function () {
        var _this = this;
        var bodyEl = this.element.find('.' + this.classSelectors.gridBody);
        var headerEl = this.element.find('.' + this.classSelectors.gridHeader);

        // sticky headers   
        bodyEl.on('scroll', function () {
            //horizontal scrolling
            if (bodyEl.outerWidth() < bodyEl.get(0).scrollWidth) {
                var pos = bodyEl.scrollLeft();
                headerEl.scrollLeft(pos);
            }
        });
    },

    // Destructor
    _destroy: function () {
        this.element
            .removeClass("afgrid")
            .text("");
    }
});

//Helpers
$.widget("ui.afGrid", $.ui.afGrid, {
    _newElement: function (tag, c) {
        var el = $("<" + tag + "></" + tag + "div>");
        if (c) el.addClass(c);
        return el;
    },

    _getColProperties: function (name) {
        var colModel = null;

        $.each(this.options.colModel, function (index, col) {
            if (col.name == name) {
                colModel = col;
                return false;
            }
        });
        return colModel;
    },

    _getSubsetData: function(data, page, pageSize) {
        var copy = data.slice(0);
        return copy.splice(((page - 1) * pageSize), Math.min(pageSize, copy.length - ((page - 1) * pageSize)));
    },

    _formatString: function (str, arguments) {
        for (var i = 0; i < arguments.length; i++) {
            var reg = new RegExp("\\{" + i + "\\}", "gm");
            str = str.replace(reg, arguments[i]);
        }
        return str;
    },

    _hasVerticalScrollbar: function(elem) {
        return elem[0].clientHeight < elem[0].scrollHeight;
    },

    _hasHorizontalScrollbar: function(elem) {
        return elem[0].scrollWidth > elem[0].clientWidth;
    },

    _getVerticalScrollbarWidth: function() {
        var scrollDiv = document.createElement("div");
        scrollDiv.className = "scrollbar-measure";
        document.body.appendChild(scrollDiv);

        // Get the scrollbar width
        var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

        // Delete the DIV 
        document.body.removeChild(scrollDiv);

        return scrollbarWidth;
    },

    _blockUI: function () {
    var loadingContainer = this.element.find('.' + this.classSelectors.overlay);
    var img = this.element.find('.' + this.classSelectors.overlay + ' img');

    var loaderHeight = this.element.find('.' + this.classSelectors.gridBody).outerHeight();
    var loaderWidth = this.element.find('.' + this.classSelectors.gridBody).outerWidth();

    var headerHeight = this.element.find('.' + this.classSelectors.gridHeader).outerHeight();
        //loaderHeight = loaderHeight - headerHeight;
        //var pager = this.options.showPager || this.options.viewRecords ? this.element.find('.' +this.classSelectors.pager).outerHeight(): 0;

        //var loaderHeight = parseInt(bodyHeight.substring(0, bodyHeight.length -2)) - headerHeight -pager;
        //var loaderWidth = parseInt(bodyWidth.substring(0, bodyWidth.length - 2));


    loadingContainer.css('height', loaderHeight);
    loadingContainer.css('width', loaderWidth);
    loadingContainer.css('top', headerHeight);


    img.css('margin-left', loaderWidth / 2 - img.width());
    img.css('margin-top', loaderHeight / 2 - img.height()); 

    this.element.find('.' + this.classSelectors.overlay).css("display", "block");

    },

    _unblockUI: function () {
        this.element.find('.' + this.classSelectors.overlay).css("display", "none");
    }

});

//Formatter
$.widget("ui.afGrid", $.ui.afGrid, {
    _formatter: function (colModel, value) {
        var _this = this;
        var val = value || this.formatter.defaultValue;
        var format = colModel.formatter;
        var options = colModel.formatoptions;

        switch (format) {
            case "integer":
                val = this._integerFormat(options, val);
                break;
            case "number":
                val = this._decimalFormat(options, val);
                break;
            case "currency":
                val = this._currencyFormat(options, val);
                break;
            case "date":
                var format = this._getFormatOption("date", options, "format");
                val = $.format.date(val, format);
                break;
            case "link":
                val = this._linkFormat(val);
                break;
            default: break;
        }

        return val;
    },

    //eg: _getformatOption("integer", "thousandsSeparator");
    _getFormatOption: function (format, option, fn) {
        var formatOption = option || {};
        return formatOption[fn] !== undefined ? formatOption[fn] : this.formatter[format][fn];
    },

    _integerFormat: function (options, nStr) {
        var sep = this._getFormatOption("integer", options, "thousandsSeparator");
        nStr = parseInt(nStr).toString();
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(nStr)) {
            nStr = nStr.replace(rgx, '$1' + sep + '$2');
        }
        return nStr;
    },

    _decimalFormat: function (options, str) {
        var decSep = this._getFormatOption("number", options, "decimalSeparator");
        var thouSep = this._getFormatOption("number", options, "thousandsSeparator");
        var decPlaces = this._getFormatOption("number", options, "decimalPlaces");

        str = parseFloat(str).toFixed(decPlaces).toString();
        var dpos = str.indexOf('.');
        var strEnd = dpos == -1 ? '' : str.substring(dpos + 1, str.length);
        var strStart = str.substring(0, dpos);
        var options = [{ thousandsSeparator: thouSep }];
        strStart = this._integerFormat(options, strStart);

        return strStart + decSep + strEnd;
    },

    _currencyFormat: function (options, str) {
        var decSep = this._getFormatOption("currency", options, "decimalSeparator");
        var thouSep = this._getFormatOption("currency", options, "thousandsSeparator");
        var decPlaces = this._getFormatOption("currency", options, "decimalPlaces");
        var prefix = this._getFormatOption("currency", options, "prefix");
        var suffix = this._getFormatOption("currency", options, "suffix");

        str = parseFloat(str).toFixed(decPlaces).toString();
        var dpos = str.indexOf('.');
        var strEnd = dpos == -1 ? '' : str.substring(dpos + 1, str.length);
        var strStart = dpos == -1 ? str : str.substring(0, dpos);
        var options = [{ thousandsSeparator: thouSep }];
        strStart = this._integerFormat(options, strStart);

        return prefix + strStart + decSep + strEnd + suffix;
    },

    _linkFormat: function (val) {
        var link = this._newElement("a", null);
        link.attr("href", val);
        link.addClass(this.classSelectors.showlink);
        link.html(val);
        link.on('click', function (e) {
            e.preventDefault();
            var url = $(this).attr('href');
            window.open(url, '_blank');
        });
        return link;
    },
});

//Sorting
$.widget("ui.afGrid", $.ui.afGrid, {
    _addSortingEvent: function (cell, value) {
        var _this = this;
        cell.addClass(_this.classSelectors.sortable);
        cell.attr('formatter', value.formatter);


        cell.on('click', function () {

            _this.options.sortBy = value.name;
            _this.element.find('.' + _this.classSelectors.uiIcon).removeClass(_this.classSelectors.uiIcon);

            var ic = _this._newElement('span', _this.classSelectors.uiIcon);


            _this._getGridData();


            _this.options.sortOrder = _this.options.sortOrder == 'desc' ? 'asc' : 'desc';

            if (_this.options.sortOrder == 'asc') ic.removeClass(_this.classSelectors.arrowUp).addClass(_this.classSelectors.arrowDown);
            else ic.removeClass(_this.classSelectors.arrowDown).addClass(_this.classSelectors.arrowUp);

            cell.append(ic);
            
            _this._blockUI();
        });
    },

    _formatterSorting: function (a, b, sortOrder, formatter) {
        var inverse = sortOrder == 'asc';


        switch (formatter) {
            case "integer":
                a = parseInt(a);
                b = paseInt(b);
                break;
            case "number":
            case "currency":
                a = parseFloat(a);
                b = parseFloat(b);
                break;

            case "date":
                var format = "yyyy/MM/dd HH:mm:ss";
                a = $.format.date(a, format);
                b = $.format.date(b, format);
                break;

            case "link":
            default:
                a = $.isNumeric(a) ? parseFloat(a) : a;
                b = $.isNumeric(b) ? parseFloat(b) : b;
                break;
        }


        return (a < b) ? inverse ? -1 : 1
        : inverse ? 1 : -1;
    },
});

//Public Methods
$.widget("ui.afGrid", $.ui.afGrid, {

    getRowData: function (rowId) {
        return this.element.find('[data-id=' + rowId + ']');

    },

    getCell: function (rowId, iCol) {
        var rowData = this.getRowData(rowId), index = null;

        if (rowData == null || rowData == undefined) return null;
        if ($.isNumeric(iCol)) return rowData.length ? rowData.children().eq(iCol) : null;

        $.each(this.options.colModel, function (idx, col) {
            if (col.name == iCol) {
                index = idx;
                return false;
            }
        });

        return idx ? rowData.children.eq(index) : null;
    },


    getDataIDs: function () {
        var ids = [];
        this.element.find('[data-id]').each(function () {
            ids.push($(this).attr('data-id'));
        })
        return ids;
    },

    setGridWidth: function (newWidth, shrinkToFit) {
        this.options.width = newWidth;
        this.options.shrinkToFit = shrinkToFit;
        this._getGridData();
    },
});