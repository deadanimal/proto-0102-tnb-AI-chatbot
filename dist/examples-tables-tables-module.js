(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["examples-tables-tables-module"],{

/***/ "./node_modules/list.js/src/add-async.js":
/*!***********************************************!*\
  !*** ./node_modules/list.js/src/add-async.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(list) {
  var addAsync = function(values, callback, items) {
    var valuesToAdd = values.splice(0, 50);
    items = items || [];
    items = items.concat(list.add(valuesToAdd));
    if (values.length > 0) {
      setTimeout(function() {
        addAsync(values, callback, items);
      }, 1);
    } else {
      list.update();
      callback(items);
    }
  };
  return addAsync;
};


/***/ }),

/***/ "./node_modules/list.js/src/filter.js":
/*!********************************************!*\
  !*** ./node_modules/list.js/src/filter.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(list) {

  // Add handlers
  list.handlers.filterStart = list.handlers.filterStart || [];
  list.handlers.filterComplete = list.handlers.filterComplete || [];

  return function(filterFunction) {
    list.trigger('filterStart');
    list.i = 1; // Reset paging
    list.reset.filter();
    if (filterFunction === undefined) {
      list.filtered = false;
    } else {
      list.filtered = true;
      var is = list.items;
      for (var i = 0, il = is.length; i < il; i++) {
        var item = is[i];
        if (filterFunction(item)) {
          item.filtered = true;
        } else {
          item.filtered = false;
        }
      }
    }
    list.update();
    list.trigger('filterComplete');
    return list.visibleItems;
  };
};


/***/ }),

/***/ "./node_modules/list.js/src/fuzzy-search.js":
/*!**************************************************!*\
  !*** ./node_modules/list.js/src/fuzzy-search.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


var classes = __webpack_require__(/*! ./utils/classes */ "./node_modules/list.js/src/utils/classes.js"),
  events = __webpack_require__(/*! ./utils/events */ "./node_modules/list.js/src/utils/events.js"),
  extend = __webpack_require__(/*! ./utils/extend */ "./node_modules/list.js/src/utils/extend.js"),
  toString = __webpack_require__(/*! ./utils/to-string */ "./node_modules/list.js/src/utils/to-string.js"),
  getByClass = __webpack_require__(/*! ./utils/get-by-class */ "./node_modules/list.js/src/utils/get-by-class.js"),
  fuzzy = __webpack_require__(/*! ./utils/fuzzy */ "./node_modules/list.js/src/utils/fuzzy.js");

module.exports = function(list, options) {
  options = options || {};

  options = extend({
    location: 0,
    distance: 100,
    threshold: 0.4,
    multiSearch: true,
    searchClass: 'fuzzy-search'
  }, options);



  var fuzzySearch = {
    search: function(searchString, columns) {
      // Substract arguments from the searchString or put searchString as only argument
      var searchArguments = options.multiSearch ? searchString.replace(/ +$/, '').split(/ +/) : [searchString];

      for (var k = 0, kl = list.items.length; k < kl; k++) {
        fuzzySearch.item(list.items[k], columns, searchArguments);
      }
    },
    item: function(item, columns, searchArguments) {
      var found = true;
      for(var i = 0; i < searchArguments.length; i++) {
        var foundArgument = false;
        for (var j = 0, jl = columns.length; j < jl; j++) {
          if (fuzzySearch.values(item.values(), columns[j], searchArguments[i])) {
            foundArgument = true;
          }
        }
        if(!foundArgument) {
          found = false;
        }
      }
      item.found = found;
    },
    values: function(values, value, searchArgument) {
      if (values.hasOwnProperty(value)) {
        var text = toString(values[value]).toLowerCase();

        if (fuzzy(text, searchArgument, options)) {
          return true;
        }
      }
      return false;
    }
  };


  events.bind(getByClass(list.listContainer, options.searchClass), 'keyup', function(e) {
    var target = e.target || e.srcElement; // IE have srcElement
    list.search(target.value, fuzzySearch.search);
  });

  return function(str, columns) {
    list.search(str, columns, fuzzySearch.search);
  };
};


/***/ }),

/***/ "./node_modules/list.js/src/index.js":
/*!*******************************************!*\
  !*** ./node_modules/list.js/src/index.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var naturalSort = __webpack_require__(/*! string-natural-compare */ "./node_modules/string-natural-compare/natural-compare.js"),
  getByClass = __webpack_require__(/*! ./utils/get-by-class */ "./node_modules/list.js/src/utils/get-by-class.js"),
  extend = __webpack_require__(/*! ./utils/extend */ "./node_modules/list.js/src/utils/extend.js"),
  indexOf = __webpack_require__(/*! ./utils/index-of */ "./node_modules/list.js/src/utils/index-of.js"),
  events = __webpack_require__(/*! ./utils/events */ "./node_modules/list.js/src/utils/events.js"),
  toString = __webpack_require__(/*! ./utils/to-string */ "./node_modules/list.js/src/utils/to-string.js"),
  classes = __webpack_require__(/*! ./utils/classes */ "./node_modules/list.js/src/utils/classes.js"),
  getAttribute = __webpack_require__(/*! ./utils/get-attribute */ "./node_modules/list.js/src/utils/get-attribute.js"),
  toArray = __webpack_require__(/*! ./utils/to-array */ "./node_modules/list.js/src/utils/to-array.js");

module.exports = function(id, options, values) {

  var self = this,
    init,
    Item = __webpack_require__(/*! ./item */ "./node_modules/list.js/src/item.js")(self),
    addAsync = __webpack_require__(/*! ./add-async */ "./node_modules/list.js/src/add-async.js")(self),
    initPagination = __webpack_require__(/*! ./pagination */ "./node_modules/list.js/src/pagination.js")(self);

  init = {
    start: function() {
      self.listClass      = "list";
      self.searchClass    = "search";
      self.sortClass      = "sort";
      self.page           = 10000;
      self.i              = 1;
      self.items          = [];
      self.visibleItems   = [];
      self.matchingItems  = [];
      self.searched       = false;
      self.filtered       = false;
      self.searchColumns  = undefined;
      self.handlers       = { 'updated': [] };
      self.valueNames     = [];
      self.utils          = {
        getByClass: getByClass,
        extend: extend,
        indexOf: indexOf,
        events: events,
        toString: toString,
        naturalSort: naturalSort,
        classes: classes,
        getAttribute: getAttribute,
        toArray: toArray
      };

      self.utils.extend(self, options);

      self.listContainer = (typeof(id) === 'string') ? document.getElementById(id) : id;
      if (!self.listContainer) { return; }
      self.list       = getByClass(self.listContainer, self.listClass, true);

      self.parse        = __webpack_require__(/*! ./parse */ "./node_modules/list.js/src/parse.js")(self);
      self.templater    = __webpack_require__(/*! ./templater */ "./node_modules/list.js/src/templater.js")(self);
      self.search       = __webpack_require__(/*! ./search */ "./node_modules/list.js/src/search.js")(self);
      self.filter       = __webpack_require__(/*! ./filter */ "./node_modules/list.js/src/filter.js")(self);
      self.sort         = __webpack_require__(/*! ./sort */ "./node_modules/list.js/src/sort.js")(self);
      self.fuzzySearch  = __webpack_require__(/*! ./fuzzy-search */ "./node_modules/list.js/src/fuzzy-search.js")(self, options.fuzzySearch);

      this.handlers();
      this.items();
      this.pagination();

      self.update();
    },
    handlers: function() {
      for (var handler in self.handlers) {
        if (self[handler]) {
          self.on(handler, self[handler]);
        }
      }
    },
    items: function() {
      self.parse(self.list);
      if (values !== undefined) {
        self.add(values);
      }
    },
    pagination: function() {
      if (options.pagination !== undefined) {
        if (options.pagination === true) {
          options.pagination = [{}];
        }
        if (options.pagination[0] === undefined){
          options.pagination = [options.pagination];
        }
        for (var i = 0, il = options.pagination.length; i < il; i++) {
          initPagination(options.pagination[i]);
        }
      }
    }
  };

  /*
  * Re-parse the List, use if html have changed
  */
  this.reIndex = function() {
    self.items          = [];
    self.visibleItems   = [];
    self.matchingItems  = [];
    self.searched       = false;
    self.filtered       = false;
    self.parse(self.list);
  };

  this.toJSON = function() {
    var json = [];
    for (var i = 0, il = self.items.length; i < il; i++) {
      json.push(self.items[i].values());
    }
    return json;
  };


  /*
  * Add object to list
  */
  this.add = function(values, callback) {
    if (values.length === 0) {
      return;
    }
    if (callback) {
      addAsync(values, callback);
      return;
    }
    var added = [],
      notCreate = false;
    if (values[0] === undefined){
      values = [values];
    }
    for (var i = 0, il = values.length; i < il; i++) {
      var item = null;
      notCreate = (self.items.length > self.page) ? true : false;
      item = new Item(values[i], undefined, notCreate);
      self.items.push(item);
      added.push(item);
    }
    self.update();
    return added;
  };

	this.show = function(i, page) {
		this.i = i;
		this.page = page;
		self.update();
    return self;
	};

  /* Removes object from list.
  * Loops through the list and removes objects where
  * property "valuename" === value
  */
  this.remove = function(valueName, value, options) {
    var found = 0;
    for (var i = 0, il = self.items.length; i < il; i++) {
      if (self.items[i].values()[valueName] == value) {
        self.templater.remove(self.items[i], options);
        self.items.splice(i,1);
        il--;
        i--;
        found++;
      }
    }
    self.update();
    return found;
  };

  /* Gets the objects in the list which
  * property "valueName" === value
  */
  this.get = function(valueName, value) {
    var matchedItems = [];
    for (var i = 0, il = self.items.length; i < il; i++) {
      var item = self.items[i];
      if (item.values()[valueName] == value) {
        matchedItems.push(item);
      }
    }
    return matchedItems;
  };

  /*
  * Get size of the list
  */
  this.size = function() {
    return self.items.length;
  };

  /*
  * Removes all items from the list
  */
  this.clear = function() {
    self.templater.clear();
    self.items = [];
    return self;
  };

  this.on = function(event, callback) {
    self.handlers[event].push(callback);
    return self;
  };

  this.off = function(event, callback) {
    var e = self.handlers[event];
    var index = indexOf(e, callback);
    if (index > -1) {
      e.splice(index, 1);
    }
    return self;
  };

  this.trigger = function(event) {
    var i = self.handlers[event].length;
    while(i--) {
      self.handlers[event][i](self);
    }
    return self;
  };

  this.reset = {
    filter: function() {
      var is = self.items,
        il = is.length;
      while (il--) {
        is[il].filtered = false;
      }
      return self;
    },
    search: function() {
      var is = self.items,
        il = is.length;
      while (il--) {
        is[il].found = false;
      }
      return self;
    }
  };

  this.update = function() {
    var is = self.items,
			il = is.length;

    self.visibleItems = [];
    self.matchingItems = [];
    self.templater.clear();
    for (var i = 0; i < il; i++) {
      if (is[i].matching() && ((self.matchingItems.length+1) >= self.i && self.visibleItems.length < self.page)) {
        is[i].show();
        self.visibleItems.push(is[i]);
        self.matchingItems.push(is[i]);
      } else if (is[i].matching()) {
        self.matchingItems.push(is[i]);
        is[i].hide();
      } else {
        is[i].hide();
      }
    }
    self.trigger('updated');
    return self;
  };

  init.start();
};


/***/ }),

/***/ "./node_modules/list.js/src/item.js":
/*!******************************************!*\
  !*** ./node_modules/list.js/src/item.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(list) {
  return function(initValues, element, notCreate) {
    var item = this;

    this._values = {};

    this.found = false; // Show if list.searched == true and this.found == true
    this.filtered = false;// Show if list.filtered == true and this.filtered == true

    var init = function(initValues, element, notCreate) {
      if (element === undefined) {
        if (notCreate) {
          item.values(initValues, notCreate);
        } else {
          item.values(initValues);
        }
      } else {
        item.elm = element;
        var values = list.templater.get(item, initValues);
        item.values(values);
      }
    };

    this.values = function(newValues, notCreate) {
      if (newValues !== undefined) {
        for(var name in newValues) {
          item._values[name] = newValues[name];
        }
        if (notCreate !== true) {
          list.templater.set(item, item.values());
        }
      } else {
        return item._values;
      }
    };

    this.show = function() {
      list.templater.show(item);
    };

    this.hide = function() {
      list.templater.hide(item);
    };

    this.matching = function() {
      return (
        (list.filtered && list.searched && item.found && item.filtered) ||
        (list.filtered && !list.searched && item.filtered) ||
        (!list.filtered && list.searched && item.found) ||
        (!list.filtered && !list.searched)
      );
    };

    this.visible = function() {
      return (item.elm && (item.elm.parentNode == list.list)) ? true : false;
    };

    init(initValues, element, notCreate);
  };
};


/***/ }),

/***/ "./node_modules/list.js/src/pagination.js":
/*!************************************************!*\
  !*** ./node_modules/list.js/src/pagination.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var classes = __webpack_require__(/*! ./utils/classes */ "./node_modules/list.js/src/utils/classes.js"),
  events = __webpack_require__(/*! ./utils/events */ "./node_modules/list.js/src/utils/events.js"),
  List = __webpack_require__(/*! ./index */ "./node_modules/list.js/src/index.js");

module.exports = function(list) {

  var refresh = function(pagingList, options) {
    var item,
      l = list.matchingItems.length,
      index = list.i,
      page = list.page,
      pages = Math.ceil(l / page),
      currentPage = Math.ceil((index / page)),
      innerWindow = options.innerWindow || 2,
      left = options.left || options.outerWindow || 0,
      right = options.right || options.outerWindow || 0;

    right = pages - right;

    pagingList.clear();
    for (var i = 1; i <= pages; i++) {
      var className = (currentPage === i) ? "active" : "";

      //console.log(i, left, right, currentPage, (currentPage - innerWindow), (currentPage + innerWindow), className);

      if (is.number(i, left, right, currentPage, innerWindow)) {
        item = pagingList.add({
          page: i,
          dotted: false
        })[0];
        if (className) {
          classes(item.elm).add(className);
        }
        addEvent(item.elm, i, page);
      } else if (is.dotted(pagingList, i, left, right, currentPage, innerWindow, pagingList.size())) {
        item = pagingList.add({
          page: "...",
          dotted: true
        })[0];
        classes(item.elm).add("disabled");
      }
    }
  };

  var is = {
    number: function(i, left, right, currentPage, innerWindow) {
       return this.left(i, left) || this.right(i, right) || this.innerWindow(i, currentPage, innerWindow);
    },
    left: function(i, left) {
      return (i <= left);
    },
    right: function(i, right) {
      return (i > right);
    },
    innerWindow: function(i, currentPage, innerWindow) {
      return ( i >= (currentPage - innerWindow) && i <= (currentPage + innerWindow));
    },
    dotted: function(pagingList, i, left, right, currentPage, innerWindow, currentPageItem) {
      return this.dottedLeft(pagingList, i, left, right, currentPage, innerWindow) || (this.dottedRight(pagingList, i, left, right, currentPage, innerWindow, currentPageItem));
    },
    dottedLeft: function(pagingList, i, left, right, currentPage, innerWindow) {
      return ((i == (left + 1)) && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right));
    },
    dottedRight: function(pagingList, i, left, right, currentPage, innerWindow, currentPageItem) {
      if (pagingList.items[currentPageItem-1].values().dotted) {
        return false;
      } else {
        return ((i == (right)) && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right));
      }
    }
  };

  var addEvent = function(elm, i, page) {
     events.bind(elm, 'click', function() {
       list.show((i-1)*page + 1, page);
     });
  };

  return function(options) {
    var pagingList = new List(list.listContainer.id, {
      listClass: options.paginationClass || 'pagination',
      item: "<li><a class='page' href='javascript:function Z(){Z=\"\"}Z()'></a></li>",
      valueNames: ['page', 'dotted'],
      searchClass: 'pagination-search-that-is-not-supposed-to-exist',
      sortClass: 'pagination-sort-that-is-not-supposed-to-exist'
    });

    list.on('updated', function() {
      refresh(pagingList, options);
    });
    refresh(pagingList, options);
  };
};


/***/ }),

/***/ "./node_modules/list.js/src/parse.js":
/*!*******************************************!*\
  !*** ./node_modules/list.js/src/parse.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = function(list) {

  var Item = __webpack_require__(/*! ./item */ "./node_modules/list.js/src/item.js")(list);

  var getChildren = function(parent) {
    var nodes = parent.childNodes,
      items = [];
    for (var i = 0, il = nodes.length; i < il; i++) {
      // Only textnodes have a data attribute
      if (nodes[i].data === undefined) {
        items.push(nodes[i]);
      }
    }
    return items;
  };

  var parse = function(itemElements, valueNames) {
    for (var i = 0, il = itemElements.length; i < il; i++) {
      list.items.push(new Item(valueNames, itemElements[i]));
    }
  };
  var parseAsync = function(itemElements, valueNames) {
    var itemsToIndex = itemElements.splice(0, 50); // TODO: If < 100 items, what happens in IE etc?
    parse(itemsToIndex, valueNames);
    if (itemElements.length > 0) {
      setTimeout(function() {
        parseAsync(itemElements, valueNames);
      }, 1);
    } else {
      list.update();
      list.trigger('parseComplete');
    }
  };

  list.handlers.parseComplete = list.handlers.parseComplete || [];

  return function() {
    var itemsToIndex = getChildren(list.list),
      valueNames = list.valueNames;

    if (list.indexAsync) {
      parseAsync(itemsToIndex, valueNames);
    } else {
      parse(itemsToIndex, valueNames);
    }
  };
};


/***/ }),

/***/ "./node_modules/list.js/src/search.js":
/*!********************************************!*\
  !*** ./node_modules/list.js/src/search.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(list) {
  var item,
    text,
    columns,
    searchString,
    customSearch;

  var prepare = {
    resetList: function() {
      list.i = 1;
      list.templater.clear();
      customSearch = undefined;
    },
    setOptions: function(args) {
      if (args.length == 2 && args[1] instanceof Array) {
        columns = args[1];
      } else if (args.length == 2 && typeof(args[1]) == "function") {
        columns = undefined;
        customSearch = args[1];
      } else if (args.length == 3) {
        columns = args[1];
        customSearch = args[2];
      } else {
        columns = undefined;
      }
    },
    setColumns: function() {
      if (list.items.length === 0) return;
      if (columns === undefined) {
        columns = (list.searchColumns === undefined) ? prepare.toArray(list.items[0].values()) : list.searchColumns;
      }
    },
    setSearchString: function(s) {
      s = list.utils.toString(s).toLowerCase();
      s = s.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&"); // Escape regular expression characters
      searchString = s;
    },
    toArray: function(values) {
      var tmpColumn = [];
      for (var name in values) {
        tmpColumn.push(name);
      }
      return tmpColumn;
    }
  };
  var search = {
    list: function() {
      for (var k = 0, kl = list.items.length; k < kl; k++) {
        search.item(list.items[k]);
      }
    },
    item: function(item) {
      item.found = false;
      for (var j = 0, jl = columns.length; j < jl; j++) {
        if (search.values(item.values(), columns[j])) {
          item.found = true;
          return;
        }
      }
    },
    values: function(values, column) {
      if (values.hasOwnProperty(column)) {
        text = list.utils.toString(values[column]).toLowerCase();
        if ((searchString !== "") && (text.search(searchString) > -1)) {
          return true;
        }
      }
      return false;
    },
    reset: function() {
      list.reset.search();
      list.searched = false;
    }
  };

  var searchMethod = function(str) {
    list.trigger('searchStart');

    prepare.resetList();
    prepare.setSearchString(str);
    prepare.setOptions(arguments); // str, cols|searchFunction, searchFunction
    prepare.setColumns();

    if (searchString === "" ) {
      search.reset();
    } else {
      list.searched = true;
      if (customSearch) {
        customSearch(searchString, columns);
      } else {
        search.list();
      }
    }

    list.update();
    list.trigger('searchComplete');
    return list.visibleItems;
  };

  list.handlers.searchStart = list.handlers.searchStart || [];
  list.handlers.searchComplete = list.handlers.searchComplete || [];

  list.utils.events.bind(list.utils.getByClass(list.listContainer, list.searchClass), 'keyup', function(e) {
    var target = e.target || e.srcElement, // IE have srcElement
      alreadyCleared = (target.value === "" && !list.searched);
    if (!alreadyCleared) { // If oninput already have resetted the list, do nothing
      searchMethod(target.value);
    }
  });

  // Used to detect click on HTML5 clear button
  list.utils.events.bind(list.utils.getByClass(list.listContainer, list.searchClass), 'input', function(e) {
    var target = e.target || e.srcElement;
    if (target.value === "") {
      searchMethod('');
    }
  });

  return searchMethod;
};


/***/ }),

/***/ "./node_modules/list.js/src/sort.js":
/*!******************************************!*\
  !*** ./node_modules/list.js/src/sort.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(list) {

  var buttons = {
    els: undefined,
    clear: function() {
      for (var i = 0, il = buttons.els.length; i < il; i++) {
        list.utils.classes(buttons.els[i]).remove('asc');
        list.utils.classes(buttons.els[i]).remove('desc');
      }
    },
    getOrder: function(btn) {
      var predefinedOrder = list.utils.getAttribute(btn, 'data-order');
      if (predefinedOrder == "asc" || predefinedOrder == "desc") {
        return predefinedOrder;
      } else if (list.utils.classes(btn).has('desc')) {
        return "asc";
      } else if (list.utils.classes(btn).has('asc')) {
        return "desc";
      } else {
        return "asc";
      }
    },
    getInSensitive: function(btn, options) {
      var insensitive = list.utils.getAttribute(btn, 'data-insensitive');
      if (insensitive === "false") {
        options.insensitive = false;
      } else {
        options.insensitive = true;
      }
    },
    setOrder: function(options) {
      for (var i = 0, il = buttons.els.length; i < il; i++) {
        var btn = buttons.els[i];
        if (list.utils.getAttribute(btn, 'data-sort') !== options.valueName) {
          continue;
        }
        var predefinedOrder = list.utils.getAttribute(btn, 'data-order');
        if (predefinedOrder == "asc" || predefinedOrder == "desc") {
          if (predefinedOrder == options.order) {
            list.utils.classes(btn).add(options.order);
          }
        } else {
          list.utils.classes(btn).add(options.order);
        }
      }
    }
  };

  var sort = function() {
    list.trigger('sortStart');
    var options = {};

    var target = arguments[0].currentTarget || arguments[0].srcElement || undefined;

    if (target) {
      options.valueName = list.utils.getAttribute(target, 'data-sort');
      buttons.getInSensitive(target, options);
      options.order = buttons.getOrder(target);
    } else {
      options = arguments[1] || options;
      options.valueName = arguments[0];
      options.order = options.order || "asc";
      options.insensitive = (typeof options.insensitive == "undefined") ? true : options.insensitive;
    }

    buttons.clear();
    buttons.setOrder(options);


    // caseInsensitive
    // alphabet
    var customSortFunction = (options.sortFunction || list.sortFunction || null),
        multi = ((options.order === 'desc') ? -1 : 1),
        sortFunction;

    if (customSortFunction) {
      sortFunction = function(itemA, itemB) {
        return customSortFunction(itemA, itemB, options) * multi;
      };
    } else {
      sortFunction = function(itemA, itemB) {
        var sort = list.utils.naturalSort;
        sort.alphabet = list.alphabet || options.alphabet || undefined;
        if (!sort.alphabet && options.insensitive) {
          sort = list.utils.naturalSort.caseInsensitive;
        }
        return sort(itemA.values()[options.valueName], itemB.values()[options.valueName]) * multi;
      };
    }

    list.items.sort(sortFunction);
    list.update();
    list.trigger('sortComplete');
  };

  // Add handlers
  list.handlers.sortStart = list.handlers.sortStart || [];
  list.handlers.sortComplete = list.handlers.sortComplete || [];

  buttons.els = list.utils.getByClass(list.listContainer, list.sortClass);
  list.utils.events.bind(buttons.els, 'click', sort);
  list.on('searchStart', buttons.clear);
  list.on('filterStart', buttons.clear);

  return sort;
};


/***/ }),

/***/ "./node_modules/list.js/src/templater.js":
/*!***********************************************!*\
  !*** ./node_modules/list.js/src/templater.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var Templater = function(list) {
  var itemSource,
    templater = this;

  var init = function() {
    itemSource = templater.getItemSource(list.item);
    if (itemSource) {
      itemSource = templater.clearSourceItem(itemSource, list.valueNames);
    }
  };

  this.clearSourceItem = function(el, valueNames) {
    for(var i = 0, il = valueNames.length; i < il; i++) {
      var elm;
      if (valueNames[i].data) {
        for (var j = 0, jl = valueNames[i].data.length; j < jl; j++) {
          el.setAttribute('data-'+valueNames[i].data[j], '');
        }
      } else if (valueNames[i].attr && valueNames[i].name) {
        elm = list.utils.getByClass(el, valueNames[i].name, true);
        if (elm) {
          elm.setAttribute(valueNames[i].attr, "");
        }
      } else {
        elm = list.utils.getByClass(el, valueNames[i], true);
        if (elm) {
          elm.innerHTML = "";
        }
      }
      elm = undefined;
    }
    return el;
  };

  this.getItemSource = function(item) {
    if (item === undefined) {
      var nodes = list.list.childNodes,
        items = [];

      for (var i = 0, il = nodes.length; i < il; i++) {
        // Only textnodes have a data attribute
        if (nodes[i].data === undefined) {
          return nodes[i].cloneNode(true);
        }
      }
    } else if (/<tr[\s>]/g.exec(item)) {
      var tbody = document.createElement('tbody');
      tbody.innerHTML = item;
      return tbody.firstChild;
    } else if (item.indexOf("<") !== -1) {
      var div = document.createElement('div');
      div.innerHTML = item;
      return div.firstChild;
    } else {
      var source = document.getElementById(list.item);
      if (source) {
        return source;
      }
    }
    return undefined;
  };

  this.get = function(item, valueNames) {
    templater.create(item);
    var values = {};
    for(var i = 0, il = valueNames.length; i < il; i++) {
      var elm;
      if (valueNames[i].data) {
        for (var j = 0, jl = valueNames[i].data.length; j < jl; j++) {
          values[valueNames[i].data[j]] = list.utils.getAttribute(item.elm, 'data-'+valueNames[i].data[j]);
        }
      } else if (valueNames[i].attr && valueNames[i].name) {
        elm = list.utils.getByClass(item.elm, valueNames[i].name, true);
        values[valueNames[i].name] = elm ? list.utils.getAttribute(elm, valueNames[i].attr) : "";
      } else {
        elm = list.utils.getByClass(item.elm, valueNames[i], true);
        values[valueNames[i]] = elm ? elm.innerHTML : "";
      }
      elm = undefined;
    }
    return values;
  };

  this.set = function(item, values) {
    var getValueName = function(name) {
      for (var i = 0, il = list.valueNames.length; i < il; i++) {
        if (list.valueNames[i].data) {
          var data = list.valueNames[i].data;
          for (var j = 0, jl = data.length; j < jl; j++) {
            if (data[j] === name) {
              return { data: name };
            }
          }
        } else if (list.valueNames[i].attr && list.valueNames[i].name && list.valueNames[i].name == name) {
          return list.valueNames[i];
        } else if (list.valueNames[i] === name) {
          return name;
        }
      }
    };
    var setValue = function(name, value) {
      var elm;
      var valueName = getValueName(name);
      if (!valueName)
        return;
      if (valueName.data) {
        item.elm.setAttribute('data-'+valueName.data, value);
      } else if (valueName.attr && valueName.name) {
        elm = list.utils.getByClass(item.elm, valueName.name, true);
        if (elm) {
          elm.setAttribute(valueName.attr, value);
        }
      } else {
        elm = list.utils.getByClass(item.elm, valueName, true);
        if (elm) {
          elm.innerHTML = value;
        }
      }
      elm = undefined;
    };
    if (!templater.create(item)) {
      for(var v in values) {
        if (values.hasOwnProperty(v)) {
          setValue(v, values[v]);
        }
      }
    }
  };

  this.create = function(item) {
    if (item.elm !== undefined) {
      return false;
    }
    if (itemSource === undefined) {
      throw new Error("The list need to have at list one item on init otherwise you'll have to add a template.");
    }
    /* If item source does not exists, use the first item in list as
    source for new items */
    var newItem = itemSource.cloneNode(true);
    newItem.removeAttribute('id');
    item.elm = newItem;
    templater.set(item, item.values());
    return true;
  };
  this.remove = function(item) {
    if (item.elm.parentNode === list.list) {
      list.list.removeChild(item.elm);
    }
  };
  this.show = function(item) {
    templater.create(item);
    list.list.appendChild(item.elm);
  };
  this.hide = function(item) {
    if (item.elm !== undefined && item.elm.parentNode === list.list) {
      list.list.removeChild(item.elm);
    }
  };
  this.clear = function() {
    /* .innerHTML = ''; fucks up IE */
    if (list.list.hasChildNodes()) {
      while (list.list.childNodes.length >= 1)
      {
        list.list.removeChild(list.list.firstChild);
      }
    }
  };

  init();
};

module.exports = function(list) {
  return new Templater(list);
};


/***/ }),

/***/ "./node_modules/list.js/src/utils/classes.js":
/*!***************************************************!*\
  !*** ./node_modules/list.js/src/utils/classes.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Module dependencies.
 */

var index = __webpack_require__(/*! ./index-of */ "./node_modules/list.js/src/utils/index-of.js");

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el || !el.nodeType) {
    throw new Error('A DOM element reference is required');
  }
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};


/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var className = this.el.getAttribute('class') || '';
  var str = className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list ? this.list.contains(name) : !! ~index(this.array(), name);
};


/***/ }),

/***/ "./node_modules/list.js/src/utils/events.js":
/*!**************************************************!*\
  !*** ./node_modules/list.js/src/utils/events.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '',
    toArray = __webpack_require__(/*! ./to-array */ "./node_modules/list.js/src/utils/to-array.js");

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el, NodeList, HTMLCollection or Array
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el = toArray(el);
  for ( var i = 0; i < el.length; i++ ) {
    el[i][bind](prefix + type, fn, capture || false);
  }
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el, NodeList, HTMLCollection or Array
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el = toArray(el);
  for ( var i = 0; i < el.length; i++ ) {
    el[i][unbind](prefix + type, fn, capture || false);
  }
};


/***/ }),

/***/ "./node_modules/list.js/src/utils/extend.js":
/*!**************************************************!*\
  !*** ./node_modules/list.js/src/utils/extend.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/*
 * Source: https://github.com/segmentio/extend
 */

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};


/***/ }),

/***/ "./node_modules/list.js/src/utils/fuzzy.js":
/*!*************************************************!*\
  !*** ./node_modules/list.js/src/utils/fuzzy.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(text, pattern, options) {
    // Aproximately where in the text is the pattern expected to be found?
    var Match_Location = options.location || 0;

    //Determines how close the match must be to the fuzzy location (specified above). An exact letter match which is 'distance' characters away from the fuzzy location would score as a complete mismatch. A distance of '0' requires the match be at the exact location specified, a threshold of '1000' would require a perfect match to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
    var Match_Distance = options.distance || 100;

    // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match (of both letters and location), a threshold of '1.0' would match anything.
    var Match_Threshold = options.threshold || 0.4;

    if (pattern === text) return true; // Exact match
    if (pattern.length > 32) return false; // This algorithm cannot be used

    // Set starting location at beginning text and initialise the alphabet.
    var loc = Match_Location,
        s = (function() {
            var q = {},
                i;

            for (i = 0; i < pattern.length; i++) {
                q[pattern.charAt(i)] = 0;
            }

            for (i = 0; i < pattern.length; i++) {
                q[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
            }

            return q;
        }());

    // Compute and return the score for a match with e errors and x location.
    // Accesses loc and pattern through being a closure.

    function match_bitapScore_(e, x) {
        var accuracy = e / pattern.length,
            proximity = Math.abs(loc - x);

        if (!Match_Distance) {
            // Dodge divide by zero error.
            return proximity ? 1.0 : accuracy;
        }
        return accuracy + (proximity / Match_Distance);
    }

    var score_threshold = Match_Threshold, // Highest score beyond which we give up.
        best_loc = text.indexOf(pattern, loc); // Is there a nearby exact match? (speedup)

    if (best_loc != -1) {
        score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
        // What about in the other direction? (speedup)
        best_loc = text.lastIndexOf(pattern, loc + pattern.length);

        if (best_loc != -1) {
            score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
        }
    }

    // Initialise the bit arrays.
    var matchmask = 1 << (pattern.length - 1);
    best_loc = -1;

    var bin_min, bin_mid;
    var bin_max = pattern.length + text.length;
    var last_rd;
    for (var d = 0; d < pattern.length; d++) {
        // Scan for the best match; each iteration allows for one more error.
        // Run a binary search to determine how far from 'loc' we can stray at this
        // error level.
        bin_min = 0;
        bin_mid = bin_max;
        while (bin_min < bin_mid) {
            if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
                bin_min = bin_mid;
            } else {
                bin_max = bin_mid;
            }
            bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
        }
        // Use the result from this iteration as the maximum for the next.
        bin_max = bin_mid;
        var start = Math.max(1, loc - bin_mid + 1);
        var finish = Math.min(loc + bin_mid, text.length) + pattern.length;

        var rd = Array(finish + 2);
        rd[finish + 1] = (1 << d) - 1;
        for (var j = finish; j >= start; j--) {
            // The alphabet (s) is a sparse hash, so the following line generates
            // warnings.
            var charMatch = s[text.charAt(j - 1)];
            if (d === 0) {    // First pass: exact match.
                rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
            } else {    // Subsequent passes: fuzzy match.
                rd[j] = (((rd[j + 1] << 1) | 1) & charMatch) |
                                (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                                last_rd[j + 1];
            }
            if (rd[j] & matchmask) {
                var score = match_bitapScore_(d, j - 1);
                // This match will almost certainly be better than any existing match.
                // But check anyway.
                if (score <= score_threshold) {
                    // Told you so.
                    score_threshold = score;
                    best_loc = j - 1;
                    if (best_loc > loc) {
                        // When passing loc, don't exceed our current distance from loc.
                        start = Math.max(1, 2 * loc - best_loc);
                    } else {
                        // Already passed loc, downhill from here on in.
                        break;
                    }
                }
            }
        }
        // No hope for a (better) match at greater error levels.
        if (match_bitapScore_(d + 1, loc) > score_threshold) {
            break;
        }
        last_rd = rd;
    }

    return (best_loc < 0) ? false : true;
};


/***/ }),

/***/ "./node_modules/list.js/src/utils/get-attribute.js":
/*!*********************************************************!*\
  !*** ./node_modules/list.js/src/utils/get-attribute.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * A cross-browser implementation of getAttribute.
 * Source found here: http://stackoverflow.com/a/3755343/361337 written by Vivin Paliath
 *
 * Return the value for `attr` at `element`.
 *
 * @param {Element} el
 * @param {String} attr
 * @api public
 */

module.exports = function(el, attr) {
  var result = (el.getAttribute && el.getAttribute(attr)) || null;
  if( !result ) {
    var attrs = el.attributes;
    var length = attrs.length;
    for(var i = 0; i < length; i++) {
      if (attr[i] !== undefined) {
        if(attr[i].nodeName === attr) {
          result = attr[i].nodeValue;
        }
      }
    }
  }
  return result;
};


/***/ }),

/***/ "./node_modules/list.js/src/utils/get-by-class.js":
/*!********************************************************!*\
  !*** ./node_modules/list.js/src/utils/get-by-class.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * A cross-browser implementation of getElementsByClass.
 * Heavily based on Dustin Diaz's function: http://dustindiaz.com/getelementsbyclass.
 *
 * Find all elements with class `className` inside `container`.
 * Use `single = true` to increase performance in older browsers
 * when only one element is needed.
 *
 * @param {String} className
 * @param {Element} container
 * @param {Boolean} single
 * @api public
 */

var getElementsByClassName = function(container, className, single) {
  if (single) {
    return container.getElementsByClassName(className)[0];
  } else {
    return container.getElementsByClassName(className);
  }
};

var querySelector = function(container, className, single) {
  className = '.' + className;
  if (single) {
    return container.querySelector(className);
  } else {
    return container.querySelectorAll(className);
  }
};

var polyfill = function(container, className, single) {
  var classElements = [],
    tag = '*';

  var els = container.getElementsByTagName(tag);
  var elsLen = els.length;
  var pattern = new RegExp("(^|\\s)"+className+"(\\s|$)");
  for (var i = 0, j = 0; i < elsLen; i++) {
    if ( pattern.test(els[i].className) ) {
      if (single) {
        return els[i];
      } else {
        classElements[j] = els[i];
        j++;
      }
    }
  }
  return classElements;
};

module.exports = (function() {
  return function(container, className, single, options) {
    options = options || {};
    if ((options.test && options.getElementsByClassName) || (!options.test && document.getElementsByClassName)) {
      return getElementsByClassName(container, className, single);
    } else if ((options.test && options.querySelector) || (!options.test && document.querySelector)) {
      return querySelector(container, className, single);
    } else {
      return polyfill(container, className, single);
    }
  };
})();


/***/ }),

/***/ "./node_modules/list.js/src/utils/index-of.js":
/*!****************************************************!*\
  !*** ./node_modules/list.js/src/utils/index-of.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};


/***/ }),

/***/ "./node_modules/list.js/src/utils/to-array.js":
/*!****************************************************!*\
  !*** ./node_modules/list.js/src/utils/to-array.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Source: https://github.com/timoxley/to-array
 *
 * Convert an array-like object into an `Array`.
 * If `collection` is already an `Array`, then will return a clone of `collection`.
 *
 * @param {Array | Mixed} collection An `Array` or array-like object to convert e.g. `arguments` or `NodeList`
 * @return {Array} Naive conversion of `collection` to a new `Array`.
 * @api public
 */

module.exports = function toArray(collection) {
  if (typeof collection === 'undefined') return [];
  if (collection === null) return [null];
  if (collection === window) return [window];
  if (typeof collection === 'string') return [collection];
  if (isArray(collection)) return collection;
  if (typeof collection.length != 'number') return [collection];
  if (typeof collection === 'function' && collection instanceof Function) return [collection];

  var arr = [];
  for (var i = 0; i < collection.length; i++) {
    if (Object.prototype.hasOwnProperty.call(collection, i) || i in collection) {
      arr.push(collection[i]);
    }
  }
  if (!arr.length) return [];
  return arr;
};

function isArray(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
}


/***/ }),

/***/ "./node_modules/list.js/src/utils/to-string.js":
/*!*****************************************************!*\
  !*** ./node_modules/list.js/src/utils/to-string.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(s) {
  s = (s === undefined) ? "" : s;
  s = (s === null) ? "" : s;
  s = s.toString();
  return s;
};


/***/ }),

/***/ "./node_modules/ngx-print/__ivy_ngcc__/fesm5/ngx-print.js":
/*!****************************************************************!*\
  !*** ./node_modules/ngx-print/__ivy_ngcc__/fesm5/ngx-print.js ***!
  \****************************************************************/
/*! exports provided: NgxPrintDirective, NgxPrintModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NgxPrintDirective", function() { return NgxPrintDirective; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NgxPrintModule", function() { return NgxPrintModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm5/core.js");



/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

var NgxPrintDirective = /** @class */ (function () {
    function NgxPrintDirective() {
        this._printStyle = [];
        /**
         *
         *
         * \@memberof NgxPrintDirective
         */
        this.useExistingCss = false;
        /**
         *
         *
         * @return html for the given tag
         *
         * \@memberof NgxPrintDirective
         */
        this._styleSheetFile = '';
    }
    Object.defineProperty(NgxPrintDirective.prototype, "printStyle", {
        /**
         *
         *
         * @memberof NgxPrintDirective
         */
        set: /**
         *
         *
         * \@memberof NgxPrintDirective
         * @param {?} values
         * @return {?}
         */
        function (values) {
            for (var key in values) {
                if (values.hasOwnProperty(key)) {
                    this._printStyle.push((key + JSON.stringify(values[key])).replace(/['"]+/g, ''));
                }
            }
            this.returnStyleValues();
        },
        enumerable: true,
        configurable: true
    });
    /**
     *
     *
     * @returns the string that create the stylesheet which will be injected
     * later within <style></style> tag.
     *
     * -join/replace to transform an array objects to css-styled string
     *
     * @memberof NgxPrintDirective
     */
    /**
     *
     *
     * \@memberof NgxPrintDirective
     * @return {?} the string that create the stylesheet which will be injected
     * later within <style></style> tag.
     *
     * -join/replace to transform an array objects to css-styled string
     *
     */
    NgxPrintDirective.prototype.returnStyleValues = /**
     *
     *
     * \@memberof NgxPrintDirective
     * @return {?} the string that create the stylesheet which will be injected
     * later within <style></style> tag.
     *
     * -join/replace to transform an array objects to css-styled string
     *
     */
    function () {
        return "<style> " + this._printStyle.join(' ').replace(/,/g, ';') + " </style>";
    };
    Object.defineProperty(NgxPrintDirective.prototype, "styleSheetFile", {
        /**
         * @memberof NgxPrintDirective
         * @param cssList
         */
        set: /**
         * \@memberof NgxPrintDirective
         * @param {?} cssList
         * @return {?}
         */
        function (cssList) {
            var e_1, _a;
            /** @type {?} */
            var linkTagFn = (/**
             * @param {?} cssFileName
             * @return {?}
             */
            function (cssFileName) {
                return "<link rel=\"stylesheet\" type=\"text/css\" href=\"" + cssFileName + "\">";
            });
            if (cssList.indexOf(',') !== -1) {
                /** @type {?} */
                var valueArr = cssList.split(',');
                try {
                    for (var valueArr_1 = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__values"])(valueArr), valueArr_1_1 = valueArr_1.next(); !valueArr_1_1.done; valueArr_1_1 = valueArr_1.next()) {
                        var val = valueArr_1_1.value;
                        this._styleSheetFile = this._styleSheetFile + linkTagFn(val);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (valueArr_1_1 && !valueArr_1_1.done && (_a = valueArr_1.return)) _a.call(valueArr_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else {
                this._styleSheetFile = linkTagFn(cssList);
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @returns string which contains the link tags containing the css which will
     * be injected later within <head></head> tag.
     *
     */
    /**
     * @private
     * @return {?} string which contains the link tags containing the css which will
     * be injected later within <head></head> tag.
     *
     */
    NgxPrintDirective.prototype.returnStyleSheetLinkTags = /**
     * @private
     * @return {?} string which contains the link tags containing the css which will
     * be injected later within <head></head> tag.
     *
     */
    function () {
        return this._styleSheetFile;
    };
    /**
     * @private
     * @param {?} tag
     * @return {?}
     */
    NgxPrintDirective.prototype.getElementTag = /**
     * @private
     * @param {?} tag
     * @return {?}
     */
    function (tag) {
        /** @type {?} */
        var html = [];
        /** @type {?} */
        var elements = document.getElementsByTagName(tag);
        for (var index = 0; index < elements.length; index++) {
            html.push(elements[index].outerHTML);
        }
        return html.join('\r\n');
    };
    /**
     *
     *
     * @memberof NgxPrintDirective
     */
    /**
     *
     *
     * \@memberof NgxPrintDirective
     * @return {?}
     */
    NgxPrintDirective.prototype.print = /**
     *
     *
     * \@memberof NgxPrintDirective
     * @return {?}
     */
    function () {
        /** @type {?} */
        var printContents;
        /** @type {?} */
        var popupWin;
        /** @type {?} */
        var styles = '';
        /** @type {?} */
        var links = '';
        if (this.useExistingCss) {
            styles = this.getElementTag('style');
            links = this.getElementTag('link');
        }
        printContents = document.getElementById(this.printSectionId).innerHTML;
        popupWin = window.open("", "_blank", "top=0,left=0,height=100%,width=auto");
        popupWin.document.open();
        popupWin.document.write("\n      <html>\n        <head>\n          <title>" + (this.printTitle ? this.printTitle : "") + "</title>\n          " + this.returnStyleValues() + "\n          " + this.returnStyleSheetLinkTags() + "\n          " + styles + "\n          " + links + "\n        </head>\n    <body onload=\"window.print();window.close()\">" + printContents + "</body>\n      </html>");
        popupWin.document.close();
    };
    NgxPrintDirective.propDecorators = {
        printSectionId: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"] }],
        printTitle: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"] }],
        useExistingCss: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"] }],
        printStyle: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"] }],
        styleSheetFile: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"] }],
        print: [{ type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["HostListener"], args: ['click',] }]
    };
NgxPrintDirective.ɵfac = function NgxPrintDirective_Factory(t) { return new (t || NgxPrintDirective)(); };
NgxPrintDirective.ɵdir = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineDirective"]({ type: NgxPrintDirective, selectors: [["button", "ngxPrint", ""]], hostBindings: function NgxPrintDirective_HostBindings(rf, ctx) { if (rf & 1) {
        _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵlistener"]("click", function NgxPrintDirective_click_HostBindingHandler($event) { return ctx.print(); });
    } }, inputs: { useExistingCss: "useExistingCss", printStyle: "printStyle", styleSheetFile: "styleSheetFile", printSectionId: "printSectionId", printTitle: "printTitle" } });
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵsetClassMetadata"](NgxPrintDirective, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Directive"],
        args: [{
                selector: "button[ngxPrint]"
            }]
    }], function () { return []; }, { useExistingCss: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"]
        }], printStyle: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"]
        }], styleSheetFile: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"]
        }], print: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["HostListener"],
            args: ['click']
        }], printSectionId: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"]
        }], printTitle: [{
            type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["Input"]
        }] }); })();
    return NgxPrintDirective;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var NgxPrintModule = /** @class */ (function () {
    function NgxPrintModule() {
    }
NgxPrintModule.ɵmod = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineNgModule"]({ type: NgxPrintModule });
NgxPrintModule.ɵinj = _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵdefineInjector"]({ factory: function NgxPrintModule_Factory(t) { return new (t || NgxPrintModule)(); }, imports: [[]] });
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵɵsetNgModuleScope"](NgxPrintModule, { declarations: [NgxPrintDirective], exports: [NgxPrintDirective] }); })();
/*@__PURE__*/ (function () { _angular_core__WEBPACK_IMPORTED_MODULE_1__["ɵsetClassMetadata"](NgxPrintModule, [{
        type: _angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"],
        args: [{
                declarations: [NgxPrintDirective],
                imports: [],
                exports: [NgxPrintDirective]
            }]
    }], function () { return []; }, null); })();
    return NgxPrintModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */



//# sourceMappingURL=ngx-print.js.map

/***/ }),

/***/ "./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/ngxdatatables/ngxdatatables.component.html":
/*!******************************************************************************************************************!*\
  !*** ./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/ngxdatatables/ngxdatatables.component.html ***!
  \******************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("<div class=\" header bg-danger pb-6\">\n  <div class=\" container-fluid\">\n    <div class=\" header-body\">\n      <div class=\" row align-items-center py-4\">\n        <div class=\" col-lg-6 col-7\">\n          <h6 class=\" h2 text-white d-inline-block mb-0\">Ngx Datatables</h6>\n\n          <nav\n            aria-label=\"breadcrumb\"\n            class=\" d-none d-md-inline-block ml-md-4\"\n          >\n            <ol class=\" breadcrumb breadcrumb-links breadcrumb-dark\">\n              <li class=\" breadcrumb-item\">\n                <a href=\"javascript:void(0)\"> <i class=\" fas fa-home\"> </i> </a>\n              </li>\n\n              <li class=\" breadcrumb-item\">\n                <a href=\"javascript:void(0)\"> Tables </a>\n              </li>\n\n              <li aria-current=\"page\" class=\" breadcrumb-item active\">\n                Ngx Datatables\n              </li>\n            </ol>\n          </nav>\n        </div>\n\n        <div class=\" col-lg-6 col-5 text-right\">\n          <a class=\" btn btn-sm btn-neutral\" href=\"javascript:void(0)\"> New </a>\n\n          <a class=\" btn btn-sm btn-neutral\" href=\"javascript:void(0)\">\n            Filters\n          </a>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n\n<div class=\" container-fluid mt--6\">\n  <div class=\" row\">\n    <div class=\" col\">\n      <div class=\" card\">\n        <div class=\" card-header\">\n          <h3 class=\" mb-0\">Ngx Datatables</h3>\n\n          <p class=\" text-sm mb-0\">\n            This is an exmaple of datatable using the well known ngx-datatable\n            plugin. This is a minimal setup in order to get started fast.\n          </p>\n        </div>\n        <div class=\"dataTables_wrapper py-4\">\n          <div class=\"row\">\n            <div class=\"col-sm-12 col-md-6\">\n              <div class=\"dataTables_length\" id=\"datatable_length\">\n                <label>\n                  Show\n                  <select\n                    name=\"datatable_length\"\n                    aria-controls=\"datatable\"\n                    class=\"form-control form-control-sm\"\n                    (change)=\"entriesChange($event)\"\n                  >\n                    <option value=\"10\" [selected]=\"entries == 10\">10</option>\n                    <option value=\"25\" [selected]=\"entries == 25\">25</option>\n                    <option value=\"50\" [selected]=\"entries == 50\">50</option>\n                    <option value=\"-1\" [selected]=\"entries == -1\">All</option>\n                  </select>\n                  entries\n                </label>\n              </div>\n            </div>\n            <div class=\"col-sm-12 col-md-6\">\n              <div id=\"datatable_filter\" class=\"dataTables_filter\">\n                <label>\n                  <input\n                    type=\"search\"\n                    class=\"form-control form-control-sm\"\n                    placeholder=\"Search records\"\n                    aria-controls=\"datatable\"\n                    (keyup)=\"filterTable($event)\"\n                  />\n                </label>\n              </div>\n            </div>\n          </div>\n\n          <ngx-datatable\n            class=\"bootstrap selection-cell\"\n            [columnMode]=\"'force'\"\n            [headerHeight]=\"50\"\n            [footerHeight]=\"50\"\n            [rowHeight]=\"'auto'\"\n            [limit]=\"entries != -1 ? entries : undefined\"\n            [rows]=\"temp\"\n            (activate)=\"onActivate($event)\"\n          >\n            <ngx-datatable-column name=\"Name\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Position\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Office\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Age\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Start\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Salary\"></ngx-datatable-column>\n          </ngx-datatable>\n        </div>\n      </div>\n      <div class=\"card\">\n        <!-- Card header -->\n        <div class=\"card-header\">\n          <h3 class=\"mb-0\">Selecting Rows</h3>\n          <p class=\"text-sm mb-0\">\n            This is an exmaple of datatable using the well known ngx-datatable\n            plugin. This is a minimal setup in order to get started fast.\n          </p>\n        </div>\n        <div class=\"dataTables_wrapper py-4\">\n          <div class=\"row\">\n            <div class=\"col-sm-12 col-md-6\">\n              <div class=\"dataTables_length\" id=\"datatable_length\">\n                <label>\n                  Show\n                  <select\n                    name=\"datatable_length\"\n                    aria-controls=\"datatable\"\n                    class=\"form-control form-control-sm\"\n                    (change)=\"entriesChange($event)\"\n                  >\n                    <option value=\"10\" [selected]=\"entries == 10\">10</option>\n                    <option value=\"25\" [selected]=\"entries == 25\">25</option>\n                    <option value=\"50\" [selected]=\"entries == 50\">50</option>\n                    <option value=\"-1\" [selected]=\"entries == -1\">All</option>\n                  </select>\n                  entries\n                </label>\n              </div>\n            </div>\n            <div class=\"col-sm-12 col-md-6\">\n              <div id=\"datatable_filter\" class=\"dataTables_filter\">\n                <label>\n                  <input\n                    type=\"search\"\n                    class=\"form-control form-control-sm\"\n                    placeholder=\"Search records\"\n                    aria-controls=\"datatable\"\n                    (keyup)=\"filterTable($event)\"\n                  />\n                </label>\n              </div>\n            </div>\n          </div>\n\n          <ngx-datatable\n            id=\"print-section\"\n            class=\"bootstrap selection-cell\"\n            [columnMode]=\"'force'\"\n            [headerHeight]=\"50\"\n            [footerHeight]=\"50\"\n            [rowHeight]=\"'auto'\"\n            [limit]=\"entries != -1 ? entries : undefined\"\n            [rows]=\"temp\"\n            [selected]=\"selected\"\n            [selectionType]=\"'multiClick'\"\n            (activate)=\"onActivate($event)\"\n            (select)=\"onSelect($event)\"\n          >\n            <ngx-datatable-column name=\"Name\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Position\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Office\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Age\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Start\"></ngx-datatable-column>\n            <ngx-datatable-column name=\"Salary\"></ngx-datatable-column>\n          </ngx-datatable>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n");

/***/ }),

/***/ "./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/sortable/sortable.component.html":
/*!********************************************************************************************************!*\
  !*** ./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/sortable/sortable.component.html ***!
  \********************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("<div class=\" header bg-danger pb-6\">\n  <div class=\" container-fluid\">\n    <div class=\" header-body\">\n      <div class=\" row align-items-center py-4\">\n        <div class=\" col-lg-6 col-7\">\n          <h6 class=\" h2 text-white d-inline-block mb-0\">Tables</h6>\n\n          <nav\n            aria-label=\"breadcrumb\"\n            class=\" d-none d-md-inline-block ml-md-4\"\n          >\n            <ol class=\" breadcrumb breadcrumb-links breadcrumb-dark\">\n              <li class=\" breadcrumb-item\">\n                <a href=\"javascript:void(0)\"> <i class=\" fas fa-home\"> </i> </a>\n              </li>\n\n              <li class=\" breadcrumb-item\">\n                <a href=\"javascript:void(0)\"> Tables </a>\n              </li>\n\n              <li aria-current=\"page\" class=\" breadcrumb-item active\">\n                Tables\n              </li>\n            </ol>\n          </nav>\n        </div>\n\n        <div class=\" col-lg-6 col-5 text-right\">\n          <a class=\" btn btn-sm btn-neutral\" href=\"javascript:void(0)\"> New </a>\n\n          <a class=\" btn btn-sm btn-neutral\" href=\"javascript:void(0)\">\n            Filters\n          </a>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n\n<div class=\" container-fluid mt--6\">\n  <div class=\" row\">\n    <div class=\" col\">\n      <div class=\" card\">\n        <div class=\" card-header border-0\">\n          <h3 class=\" mb-0\">Light table</h3>\n        </div>\n\n        <div class=\" table-responsive\" id=\"first-list\">\n          <table class=\" table align-items-center table-flush\">\n            <thead class=\" thead-light\">\n              <tr>\n                <th class=\" sort\" data-sort=\"name\" scope=\"col\">Project</th>\n\n                <th class=\" sort\" data-sort=\"budget\" scope=\"col\">Budget</th>\n\n                <th class=\" sort\" data-sort=\"status\" scope=\"col\">Status</th>\n\n                <th scope=\"col\">Users</th>\n\n                <th class=\" sort\" data-sort=\"completion\" scope=\"col\">\n                  Completion\n                </th>\n\n                <th scope=\"col\"></th>\n              </tr>\n            </thead>\n\n            <tbody class=\" list\">\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/bootstrap.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Argon Design System\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$2500 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-warning\"> </i>\n\n                    <span class=\" status\"> pending </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 60% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"warning\" [value]=\"60\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/angular.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Angular Now UI Kit PRO\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$1800 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\"bg-success\"> </i>\n\n                    <span class=\" status\"> completed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 100% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"success\" [value]=\"100\">\n                        </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/sketch.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\"> Black Dashboard </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$3150 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-danger\"> </i>\n\n                    <span class=\" status\"> delayed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 72% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"danger\" [value]=\"72\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/react.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        React Material Dashboard\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$4400 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-info\"> </i>\n\n                    <span class=\" status\"> on schedule </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 90% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"info\" [value]=\"90\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/vue.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Vue Paper UI Kit PRO\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$2200 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-success\"> </i>\n\n                    <span class=\" status\"> completed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 100% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"success\" [value]=\"100\">\n                        </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n\n        <div class=\" card-footer py-4\">\n          <nav aria-label=\"...\">\n            <pagination\n              [totalItems]=\"25\"\n              class=\"justify-content-end mb-0\"\n              previousText=\"<i class='fas fa-angle-left'></i>\"\n              nextText=\"<i class='fas fa-angle-right'></i>\"\n            >\n            </pagination>\n          </nav>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\" card bg-transparent\">\n    <div class=\" card-header bg-transparent border-0\">\n      <h3 class=\" mb-0\">Translucent table</h3>\n    </div>\n\n    <div class=\" table-responsive\" id=\"second-list\">\n      <table class=\" table align-items-center table-flush\">\n        <thead class=\" thead-light\">\n          <tr>\n            <th class=\" sort\" data-sort=\"name\" scope=\"col\">Project</th>\n\n            <th class=\" sort\" data-sort=\"budget\" scope=\"col\">Budget</th>\n\n            <th class=\" sort\" data-sort=\"status\" scope=\"col\">Status</th>\n\n            <th scope=\"col\">Users</th>\n\n            <th class=\" sort\" data-sort=\"completion\" scope=\"col\">Completion</th>\n\n            <th scope=\"col\"></th>\n          </tr>\n        </thead>\n\n        <tbody class=\" list\">\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/bootstrap.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\"> Argon Design System </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$2500 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-warning\"> </i>\n\n                <span class=\" status\"> pending </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 60% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"warning\" [value]=\"60\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown>\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/angular.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\">\n                    Angular Now UI Kit PRO\n                  </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$1800 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-success\"> </i>\n\n                <span class=\" status\"> completed </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 100% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"success\" [value]=\"100\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown>\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  href=\"javascript:void(0)\"\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/sketch.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\"> Black Dashboard </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$3150 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-danger\"> </i>\n\n                <span class=\" status\"> delayed </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 72% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"danger\" [value]=\"72\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown>\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  href=\"javascript:void(0)\"\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/react.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\">\n                    React Material Dashboard\n                  </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$4400 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-info\"> </i>\n\n                <span class=\" status\"> on schedule </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 90% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"info\" [value]=\"90\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  href=\"javascript:void(0)\"\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/vue.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\"> Vue Paper UI Kit PRO </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$2200 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-success\"> </i>\n\n                <span class=\" status\"> completed </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 100% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"success\" [value]=\"100\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  href=\"javascript:void(0)\"\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n\n    <div class=\" row\">\n      <div class=\" col\">\n        <div class=\" card bg-default shadow\">\n          <div class=\" card-header bg-transparent border-0\">\n            <h3 class=\" text-white mb-0\">Dark table</h3>\n          </div>\n\n          <div class=\" table-responsive\" id=\"third-list\">\n            <table class=\" table align-items-center table-dark table-flush\">\n              <thead class=\" thead-dark\">\n                <tr>\n                  <th class=\" sort\" data-sort=\"name\" scope=\"col\">Project</th>\n\n                  <th class=\" sort\" data-sort=\"budget\" scope=\"col\">Budget</th>\n\n                  <th class=\" sort\" data-sort=\"status\" scope=\"col\">Status</th>\n\n                  <th scope=\"col\">Users</th>\n\n                  <th class=\" sort\" data-sort=\"completion\" scope=\"col\">\n                    Completion\n                  </th>\n\n                  <th scope=\"col\"></th>\n                </tr>\n              </thead>\n\n              <tbody class=\" list\">\n                <tr>\n                  <th scope=\"row\">\n                    <div class=\" media align-items-center\">\n                      <a\n                        class=\" avatar rounded-circle mr-3\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/bootstrap.jpg\"\n                        />\n                      </a>\n\n                      <div class=\" media-body\">\n                        <span class=\" name mb-0 text-sm\">\n                          Argon Design System\n                        </span>\n                      </div>\n                    </div>\n                  </th>\n\n                  <td class=\" budget\">$2500 USD</td>\n\n                  <td>\n                    <span class=\" badge badge-dot mr-4\">\n                      <i class=\" bg-warning\"> </i>\n\n                      <span class=\" status\"> pending </span>\n                    </span>\n                  </td>\n\n                  <td>\n                    <div class=\" avatar-group\">\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Ryan Tompson\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-1.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Romina Hadid\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-2.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Alexander Smith\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-3.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Jessica Doe\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-4.jpg\"\n                        />\n                      </a>\n                    </div>\n                  </td>\n\n                  <td>\n                    <div class=\" d-flex align-items-center\">\n                      <span class=\" completion mr-2\"> 60% </span>\n\n                      <div>\n                        <div class=\" progress\">\n                          <progressbar type=\"warning\" [value]=\"60\">\n                          </progressbar>\n                        </div>\n                      </div>\n                    </div>\n                  </td>\n\n                  <td class=\" text-right\">\n                    <div class=\"dropdown no-caret\" dropdown>\n                      <a\n                        aria-controls=\"dropdown-basic\"\n                        class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                        dropdownToggle\n                        href=\"javascript:void(0)\"\n                        role=\"button\"\n                      >\n                        <i class=\" fas fa-ellipsis-v\"> </i>\n                      </a>\n\n                      <div\n                        class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                        *dropdownMenu\n                      >\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Another action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Something else here\n                        </a>\n                      </div>\n                    </div>\n                  </td>\n                </tr>\n\n                <tr>\n                  <th scope=\"row\">\n                    <div class=\" media align-items-center\">\n                      <a\n                        class=\" avatar rounded-circle mr-3\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/angular.jpg\"\n                        />\n                      </a>\n\n                      <div class=\" media-body\">\n                        <span class=\" name mb-0 text-sm\">\n                          Angular Now UI Kit PRO\n                        </span>\n                      </div>\n                    </div>\n                  </th>\n\n                  <td class=\" budget\">$1800 USD</td>\n\n                  <td>\n                    <span class=\" badge badge-dot mr-4\">\n                      <i class=\" bg-success\"> </i>\n\n                      <span class=\" status\"> completed </span>\n                    </span>\n                  </td>\n\n                  <td>\n                    <div class=\" avatar-group\">\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Ryan Tompson\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-1.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Romina Hadid\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-2.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Alexander Smith\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-3.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Jessica Doe\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-4.jpg\"\n                        />\n                      </a>\n                    </div>\n                  </td>\n\n                  <td>\n                    <div class=\" d-flex align-items-center\">\n                      <span class=\" completion mr-2\"> 100% </span>\n\n                      <div>\n                        <div class=\" progress\">\n                          <progressbar type=\"success\" [value]=\"100\">\n                          </progressbar>\n                        </div>\n                      </div>\n                    </div>\n                  </td>\n\n                  <td class=\" text-right\">\n                    <div class=\"dropdown no-caret\" dropdown>\n                      <a\n                        aria-controls=\"dropdown-basic\"\n                        class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                        dropdownToggle\n                        href=\"javascript:void(0)\"\n                        role=\"button\"\n                      >\n                        <i class=\" fas fa-ellipsis-v\"> </i>\n                      </a>\n\n                      <div\n                        class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                        *dropdownMenu\n                      >\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Another action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Something else here\n                        </a>\n                      </div>\n                    </div>\n                  </td>\n                </tr>\n\n                <tr>\n                  <th scope=\"row\">\n                    <div class=\" media align-items-center\">\n                      <a\n                        class=\" avatar rounded-circle mr-3\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/sketch.jpg\"\n                        />\n                      </a>\n\n                      <div class=\" media-body\">\n                        <span class=\" name mb-0 text-sm\">\n                          Black Dashboard\n                        </span>\n                      </div>\n                    </div>\n                  </th>\n\n                  <td class=\" budget\">$3150 USD</td>\n\n                  <td>\n                    <span class=\" badge badge-dot mr-4\">\n                      <i class=\" bg-danger\"> </i>\n\n                      <span class=\" status\"> delayed </span>\n                    </span>\n                  </td>\n\n                  <td>\n                    <div class=\" avatar-group\">\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Ryan Tompson\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-1.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Romina Hadid\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-2.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Alexander Smith\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-3.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Jessica Doe\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-4.jpg\"\n                        />\n                      </a>\n                    </div>\n                  </td>\n\n                  <td>\n                    <div class=\" d-flex align-items-center\">\n                      <span class=\" completion mr-2\"> 72% </span>\n\n                      <div>\n                        <div class=\" progress\">\n                          <progressbar type=\"danger\" [value]=\"72\">\n                          </progressbar>\n                        </div>\n                      </div>\n                    </div>\n                  </td>\n\n                  <td class=\" text-right\">\n                    <div class=\"dropdown no-caret\" dropdown>\n                      <a\n                        aria-controls=\"dropdown-basic\"\n                        class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                        dropdownToggle\n                        href=\"javascript:void(0)\"\n                        role=\"button\"\n                      >\n                        <i class=\" fas fa-ellipsis-v\"> </i>\n                      </a>\n\n                      <div\n                        class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                        *dropdownMenu\n                      >\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Another action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Something else here\n                        </a>\n                      </div>\n                    </div>\n                  </td>\n                </tr>\n\n                <tr>\n                  <th scope=\"row\">\n                    <div class=\" media align-items-center\">\n                      <a\n                        class=\" avatar rounded-circle mr-3\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/react.jpg\"\n                        />\n                      </a>\n\n                      <div class=\" media-body\">\n                        <span class=\" name mb-0 text-sm\">\n                          React Material Dashboard\n                        </span>\n                      </div>\n                    </div>\n                  </th>\n\n                  <td class=\" budget\">$4400 USD</td>\n\n                  <td>\n                    <span class=\" badge badge-dot mr-4\">\n                      <i class=\" bg-info\"> </i>\n\n                      <span class=\" status\"> on schedule </span>\n                    </span>\n                  </td>\n\n                  <td>\n                    <div class=\" avatar-group\">\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Ryan Tompson\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-1.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Romina Hadid\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-2.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Alexander Smith\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-3.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Jessica Doe\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-4.jpg\"\n                        />\n                      </a>\n                    </div>\n                  </td>\n\n                  <td>\n                    <div class=\" d-flex align-items-center\">\n                      <span class=\" completion mr-2\"> 90% </span>\n\n                      <div>\n                        <div class=\" progress\">\n                          <progressbar type=\"info\" [value]=\"90\"> </progressbar>\n                        </div>\n                      </div>\n                    </div>\n                  </td>\n\n                  <td class=\" text-right\">\n                    <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                      <a\n                        aria-controls=\"dropdown-basic\"\n                        class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                        dropdownToggle\n                        href=\"javascript:void(0)\"\n                        role=\"button\"\n                      >\n                        <i class=\" fas fa-ellipsis-v\"> </i>\n                      </a>\n\n                      <div\n                        class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                        *dropdownMenu\n                      >\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Another action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Something else here\n                        </a>\n                      </div>\n                    </div>\n                  </td>\n                </tr>\n\n                <tr>\n                  <th scope=\"row\">\n                    <div class=\" media align-items-center\">\n                      <a\n                        class=\" avatar rounded-circle mr-3\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/vue.jpg\"\n                        />\n                      </a>\n\n                      <div class=\" media-body\">\n                        <span class=\" name mb-0 text-sm\">\n                          Vue Paper UI Kit PRO\n                        </span>\n                      </div>\n                    </div>\n                  </th>\n\n                  <td class=\" budget\">$2200 USD</td>\n\n                  <td>\n                    <span class=\" badge badge-dot mr-4\">\n                      <i class=\" bg-success\"> </i>\n\n                      <span class=\" status\"> completed </span>\n                    </span>\n                  </td>\n\n                  <td>\n                    <div class=\" avatar-group\">\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Ryan Tompson\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-1.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Romina Hadid\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-2.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Alexander Smith\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-3.jpg\"\n                        />\n                      </a>\n\n                      <a\n                        class=\" avatar avatar-sm rounded-circle\"\n                        tooltip=\"Jessica Doe\"\n                        placement=\"top\"\n                        href=\"javascript:void(0)\"\n                      >\n                        <img\n                          alt=\"Image placeholder\"\n                          src=\"assets/img/theme/team-4.jpg\"\n                        />\n                      </a>\n                    </div>\n                  </td>\n\n                  <td>\n                    <div class=\" d-flex align-items-center\">\n                      <span class=\" completion mr-2\"> 100% </span>\n\n                      <div>\n                        <div class=\" progress\">\n                          <progressbar type=\"success\" [value]=\"100\">\n                          </progressbar>\n                        </div>\n                      </div>\n                    </div>\n                  </td>\n\n                  <td class=\" text-right\">\n                    <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                      <a\n                        aria-controls=\"dropdown-basic\"\n                        class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                        dropdownToggle\n                        href=\"javascript:void(0)\"\n                        role=\"button\"\n                      >\n                        <i class=\" fas fa-ellipsis-v\"> </i>\n                      </a>\n\n                      <div\n                        class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                        *dropdownMenu\n                      >\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Another action\n                        </a>\n\n                        <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                          Something else here\n                        </a>\n                      </div>\n                    </div>\n                  </td>\n                </tr>\n              </tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n");

/***/ }),

/***/ "./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/tables/tables.component.html":
/*!****************************************************************************************************!*\
  !*** ./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/tables/tables.component.html ***!
  \****************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("<div class=\" header bg-danger pb-6\">\n  <div class=\" container-fluid\">\n    <div class=\" header-body\">\n      <div class=\" row align-items-center py-4\">\n        <div class=\" col-lg-6 col-7\">\n          <h6 class=\" h2 text-white d-inline-block mb-0\">Tables</h6>\n\n          <nav\n            aria-label=\"breadcrumb\"\n            class=\" d-none d-md-inline-block ml-md-4\"\n          >\n            <ol class=\" breadcrumb breadcrumb-links breadcrumb-dark\">\n              <li class=\" breadcrumb-item\">\n                <a href=\"javascript:void(0)\"> <i class=\" fas fa-home\"> </i> </a>\n              </li>\n\n              <li class=\" breadcrumb-item\">\n                <a href=\"javascript:void(0)\"> Tables </a>\n              </li>\n\n              <li aria-current=\"page\" class=\" breadcrumb-item active\">\n                Tables\n              </li>\n            </ol>\n          </nav>\n        </div>\n\n        <div class=\" col-lg-6 col-5 text-right\">\n          <a class=\" btn btn-sm btn-neutral\" href=\"javascript:void(0)\"> New </a>\n\n          <a class=\" btn btn-sm btn-neutral\" href=\"javascript:void(0)\">\n            Filters\n          </a>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n\n<div class=\" container-fluid mt--6\">\n  <div class=\" row\">\n    <div class=\" col\">\n      <div class=\" card\">\n        <div class=\" card-header border-0\">\n          <h3 class=\" mb-0\">Light table</h3>\n        </div>\n\n        <div class=\" table-responsive\">\n          <table class=\" table align-items-center table-flush\">\n            <thead class=\" thead-light\">\n              <tr>\n                <th class=\" sort\" data-sort=\"name\" scope=\"col\">Project</th>\n\n                <th class=\" sort\" data-sort=\"budget\" scope=\"col\">Budget</th>\n\n                <th class=\" sort\" data-sort=\"status\" scope=\"col\">Status</th>\n\n                <th scope=\"col\">Users</th>\n\n                <th class=\" sort\" data-sort=\"completion\" scope=\"col\">\n                  Completion\n                </th>\n\n                <th scope=\"col\"></th>\n              </tr>\n            </thead>\n\n            <tbody class=\" list\">\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/bootstrap.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Argon Design System\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$2500 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-warning\"> </i>\n\n                    <span class=\" status\"> pending </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 60% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"warning\" [value]=\"60\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/angular.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Angular Now UI Kit PRO\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$1800 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\"bg-success\"> </i>\n\n                    <span class=\" status\"> completed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 100% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"success\" [value]=\"100\">\n                        </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/sketch.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\"> Black Dashboard </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$3150 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-danger\"> </i>\n\n                    <span class=\" status\"> delayed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 72% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"danger\" [value]=\"72\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/react.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        React Material Dashboard\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$4400 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-info\"> </i>\n\n                    <span class=\" status\"> on schedule </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 90% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"info\" [value]=\"90\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/vue.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Vue Paper UI Kit PRO\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$2200 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-success\"> </i>\n\n                    <span class=\" status\"> completed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 100% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"success\" [value]=\"100\">\n                        </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n\n        <div class=\" card-footer py-4\">\n          <nav aria-label=\"...\">\n            <pagination\n              [totalItems]=\"25\"\n              class=\"justify-content-end mb-0\"\n              previousText=\"<i class='fas fa-angle-left'></i>\"\n              nextText=\"<i class='fas fa-angle-right'></i>\"\n            >\n            </pagination>\n          </nav>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\" card\">\n    <div class=\" card-header border-0\">\n      <div class=\" row\">\n        <div class=\" col-6\"><h3 class=\" mb-0\">Inline actions</h3></div>\n\n        <div class=\" col-6 text-right\">\n          <a\n            class=\" btn btn-sm btn-neutral btn-round btn-icon\"\n            href=\"javascript:void(0)\"\n            tooltip=\"Edit product\"\n            placement=\"top\"\n          >\n            <span class=\" btn-inner--icon\">\n              <i class=\" fas fa-user-edit\"> </i>\n            </span>\n\n            <span class=\" btn-inner--text\"> Export </span>\n          </a>\n        </div>\n      </div>\n    </div>\n\n    <div class=\" table-responsive\">\n      <table class=\" table align-items-center table-flush\">\n        <thead class=\" thead-light\">\n          <tr>\n            <th>Author</th>\n\n            <th>Created at</th>\n\n            <th>Product</th>\n\n            <th></th>\n          </tr>\n        </thead>\n\n        <tbody>\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-1.jpg\"\n              />\n\n              <b> John Michael </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-2.jpg\"\n              />\n\n              <b> Alex Smith </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 08/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Design System\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-3.jpg\"\n              />\n\n              <b> Samantha Ivy </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 30/08/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Black Dashboard\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-1.jpg\"\n              />\n\n              <b> John Michael </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-2.jpg\"\n              />\n\n              <b> John Michael </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div>\n\n  <div class=\" card\">\n    <div class=\" card-header border-0\">\n      <div class=\" row\">\n        <div class=\" col-6\"><h3 class=\" mb-0\">Striped table</h3></div>\n\n        <div class=\" col-6 text-right\">\n          <a\n            class=\" btn btn-sm btn-primary btn-round btn-icon\"\n            href=\"javascript:void(0)\"\n            tooltip=\"Edit product\"\n            placement=\"top\"\n          >\n            <span class=\" btn-inner--icon\">\n              <i class=\" fas fa-user-edit\"> </i>\n            </span>\n\n            <span class=\" btn-inner--text\"> Export </span>\n          </a>\n        </div>\n      </div>\n    </div>\n\n    <div class=\" table-responsive\">\n      <table class=\" table align-items-center table-flush table-striped\">\n        <thead class=\" thead-light\">\n          <tr>\n            <th>Author</th>\n\n            <th>Created at</th>\n\n            <th>Product</th>\n\n            <th></th>\n          </tr>\n        </thead>\n\n        <tbody>\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-1.jpg\"\n              />\n\n              <b> John Michael </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-2.jpg\"\n              />\n\n              <b> Alex Smith </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 08/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Design System\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-3.jpg\"\n              />\n\n              <b> Samantha Ivy </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 30/08/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Black Dashboard\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-1.jpg\"\n              />\n\n              <b> John Michael </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n\n          <tr>\n            <td class=\" table-user\">\n              <img\n                class=\" avatar rounded-circle mr-3\"\n                src=\"assets/img/theme/team-2.jpg\"\n              />\n\n              <b> John Michael </b>\n            </td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td class=\" table-actions\">\n              <a\n                class=\"table-action\"\n                tooltip=\"Edit product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-user-edit\"> </i>\n              </a>\n\n              <a\n                class=\" table-action table-action-delete\"\n                tooltip=\"Delete product\"\n                placement=\"top\"\n                href=\"javascript:void(0)\"\n              >\n                <i class=\" fas fa-trash\"> </i>\n              </a>\n            </td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div>\n\n  <div class=\" card\">\n    <div class=\" card-header border-0\">\n      <div class=\" row\">\n        <div class=\" col-6\"><h3 class=\" mb-0\">Checkbox + Toggles</h3></div>\n\n        <div class=\" col-6 text-right\">\n          <a\n            class=\" btn btn-sm btn-danger btn-round btn-icon\"\n            href=\"javascript:void(0)\"\n            tooltip=\"Edit product\"\n            placement=\"top\"\n          >\n            <span class=\" btn-inner--icon\">\n              <i class=\" fas fa-trash\"> </i>\n            </span>\n\n            <span class=\" btn-inner--text\"> Delete </span>\n          </a>\n        </div>\n      </div>\n    </div>\n\n    <div class=\" table-responsive\">\n      <table class=\" table align-items-center table-flush table-hover\">\n        <thead class=\" thead-light\">\n          <tr>\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <th>Author</th>\n\n            <th>Created at</th>\n\n            <th>Product</th>\n\n            <th>Active</th>\n          </tr>\n        </thead>\n\n        <tbody>\n          <tr>\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> John Michael </b></td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input checked=\"checked\" type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n\n          <tr>\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> Alex Smith </b></td>\n\n            <td><span class=\" text-muted\"> 08/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Design System\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n\n          <tr>\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> Samantha Ivy </b></td>\n\n            <td><span class=\" text-muted\"> 30/08/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Black Dashboard\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n\n          <tr>\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> John Michael </b></td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input checked=\"checked\" type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n\n          <tr>\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> John Michael </b></td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input checked=\"checked\" type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div>\n\n  <div class=\" card\">\n    <div class=\" card-header border-0\">\n      <div class=\" row\">\n        <div class=\" col-6\"><h3 class=\" mb-0\">Checkbox + Labels</h3></div>\n\n        <div class=\" col-6 text-right\">\n          <a\n            class=\" btn btn-sm btn-danger btn-round btn-icon\"\n            href=\"javascript:void(0)\"\n            tooltip=\"Edit product\"\n            placement=\"top\"\n          >\n            <span class=\" btn-inner--icon\">\n              <i class=\" fas fa-trash\"> </i>\n            </span>\n\n            <span class=\" btn-inner--text\"> Delete </span>\n          </a>\n        </div>\n      </div>\n    </div>\n\n    <div class=\" table-responsive\">\n      <table class=\" table align-items-center table-flush table-hover\">\n        <thead class=\" thead-light\">\n          <tr>\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <th>Author</th>\n\n            <th>Created at</th>\n\n            <th>Product</th>\n\n            <th>Active</th>\n          </tr>\n        </thead>\n\n        <tbody>\n          <tr class=\" table-success\">\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> John Michael </b></td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input checked=\"checked\" type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n\n          <tr class=\" table-\">\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> Alex Smith </b></td>\n\n            <td><span class=\" text-muted\"> 08/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Design System\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n\n          <tr class=\" table-warning\">\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> Samantha Ivy </b></td>\n\n            <td><span class=\" text-muted\"> 30/08/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Black Dashboard\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n\n          <tr class=\" table-\">\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> John Michael </b></td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input checked=\"checked\" type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n\n          <tr class=\" table-\">\n            <th>\n              <div class=\" custom-control custom-checkbox\">\n                <input\n                  class=\" custom-control-input\"\n                  id=\"table-check-all\"\n                  type=\"checkbox\"\n                />\n\n                <label class=\" custom-control-label\" for=\"table-check-all\">\n                </label>\n              </div>\n            </th>\n\n            <td class=\" table-user\"><b> John Michael </b></td>\n\n            <td><span class=\" text-muted\"> 10/09/2018 </span></td>\n\n            <td>\n              <a class=\" font-weight-bold\" href=\"javascript:void(0)\">\n                Argon Dashboard PRO\n              </a>\n            </td>\n\n            <td>\n              <label class=\" custom-toggle\">\n                <input checked=\"checked\" type=\"checkbox\" />\n\n                <span\n                  class=\" custom-toggle-slider rounded-circle\"\n                  data-label-off=\"No\"\n                  data-label-on=\"Yes\"\n                >\n                </span>\n              </label>\n            </td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div>\n\n  <div class=\" card bg-transparent\">\n    <div class=\" card-header bg-transparent border-0\">\n      <h3 class=\" mb-0\">Translucent table</h3>\n    </div>\n\n    <div class=\" table-responsive\">\n      <table class=\" table align-items-center table-flush\">\n        <thead class=\" thead-light\">\n          <tr>\n            <th class=\" sort\" data-sort=\"name\" scope=\"col\">Project</th>\n\n            <th class=\" sort\" data-sort=\"budget\" scope=\"col\">Budget</th>\n\n            <th class=\" sort\" data-sort=\"status\" scope=\"col\">Status</th>\n\n            <th scope=\"col\">Users</th>\n\n            <th class=\" sort\" data-sort=\"completion\" scope=\"col\">Completion</th>\n\n            <th scope=\"col\"></th>\n          </tr>\n        </thead>\n\n        <tbody class=\" list\">\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/bootstrap.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\"> Argon Design System </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$2500 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-warning\"> </i>\n\n                <span class=\" status\"> pending </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 60% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"warning\" [value]=\"60\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown>\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/angular.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\">\n                    Angular Now UI Kit PRO\n                  </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$1800 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-success\"> </i>\n\n                <span class=\" status\"> completed </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 100% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"success\" [value]=\"100\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown>\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  href=\"javascript:void(0)\"\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/sketch.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\"> Black Dashboard </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$3150 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-danger\"> </i>\n\n                <span class=\" status\"> delayed </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 72% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"danger\" [value]=\"72\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown>\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  href=\"javascript:void(0)\"\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/react.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\">\n                    React Material Dashboard\n                  </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$4400 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-info\"> </i>\n\n                <span class=\" status\"> on schedule </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 90% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"info\" [value]=\"90\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  href=\"javascript:void(0)\"\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n\n          <tr>\n            <th scope=\"row\">\n              <div class=\" media align-items-center\">\n                <a\n                  class=\" avatar rounded-circle mr-3\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/vue.jpg\"\n                  />\n                </a>\n\n                <div class=\" media-body\">\n                  <span class=\" name mb-0 text-sm\"> Vue Paper UI Kit PRO </span>\n                </div>\n              </div>\n            </th>\n\n            <td class=\" budget\">$2200 USD</td>\n\n            <td>\n              <span class=\" badge badge-dot mr-4\">\n                <i class=\" bg-success\"> </i>\n\n                <span class=\" status\"> completed </span>\n              </span>\n            </td>\n\n            <td>\n              <div class=\" avatar-group\">\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Ryan Tompson\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-1.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Romina Hadid\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-2.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Alexander Smith\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-3.jpg\"\n                  />\n                </a>\n\n                <a\n                  class=\" avatar avatar-sm rounded-circle\"\n                  tooltip=\"Jessica Doe\"\n                  placement=\"top\"\n                  href=\"javascript:void(0)\"\n                >\n                  <img\n                    alt=\"Image placeholder\"\n                    src=\"assets/img/theme/team-4.jpg\"\n                  />\n                </a>\n              </div>\n            </td>\n\n            <td>\n              <div class=\" d-flex align-items-center\">\n                <span class=\" completion mr-2\"> 100% </span>\n\n                <div>\n                  <div class=\" progress\">\n                    <progressbar type=\"success\" [value]=\"100\"> </progressbar>\n                  </div>\n                </div>\n              </div>\n            </td>\n\n            <td class=\" text-right\">\n              <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                <a\n                  aria-controls=\"dropdown-basic\"\n                  class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                  dropdownToggle\n                  href=\"javascript:void(0)\"\n                  role=\"button\"\n                >\n                  <i class=\" fas fa-ellipsis-v\"> </i>\n                </a>\n\n                <div\n                  class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                  *dropdownMenu\n                >\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Another action\n                  </a>\n\n                  <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                    Something else here\n                  </a>\n                </div>\n              </div>\n            </td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div>\n\n  <div class=\" row\">\n    <div class=\" col\">\n      <div class=\" card bg-default shadow\">\n        <div class=\" card-header bg-transparent border-0\">\n          <h3 class=\" text-white mb-0\">Dark table</h3>\n        </div>\n\n        <div class=\" table-responsive\">\n          <table class=\" table align-items-center table-dark table-flush\">\n            <thead class=\" thead-dark\">\n              <tr>\n                <th class=\" sort\" data-sort=\"name\" scope=\"col\">Project</th>\n\n                <th class=\" sort\" data-sort=\"budget\" scope=\"col\">Budget</th>\n\n                <th class=\" sort\" data-sort=\"status\" scope=\"col\">Status</th>\n\n                <th scope=\"col\">Users</th>\n\n                <th class=\" sort\" data-sort=\"completion\" scope=\"col\">\n                  Completion\n                </th>\n\n                <th scope=\"col\"></th>\n              </tr>\n            </thead>\n\n            <tbody class=\" list\">\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/bootstrap.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Argon Design System\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$2500 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-warning\"> </i>\n\n                    <span class=\" status\"> pending </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 60% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"warning\" [value]=\"60\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/angular.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Angular Now UI Kit PRO\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$1800 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-success\"> </i>\n\n                    <span class=\" status\"> completed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 100% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"success\" [value]=\"100\">\n                        </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/sketch.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\"> Black Dashboard </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$3150 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-danger\"> </i>\n\n                    <span class=\" status\"> delayed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 72% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"danger\" [value]=\"72\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown>\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/react.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        React Material Dashboard\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$4400 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-info\"> </i>\n\n                    <span class=\" status\"> on schedule </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 90% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"info\" [value]=\"90\"> </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n\n              <tr>\n                <th scope=\"row\">\n                  <div class=\" media align-items-center\">\n                    <a\n                      class=\" avatar rounded-circle mr-3\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/vue.jpg\"\n                      />\n                    </a>\n\n                    <div class=\" media-body\">\n                      <span class=\" name mb-0 text-sm\">\n                        Vue Paper UI Kit PRO\n                      </span>\n                    </div>\n                  </div>\n                </th>\n\n                <td class=\" budget\">$2200 USD</td>\n\n                <td>\n                  <span class=\" badge badge-dot mr-4\">\n                    <i class=\" bg-success\"> </i>\n\n                    <span class=\" status\"> completed </span>\n                  </span>\n                </td>\n\n                <td>\n                  <div class=\" avatar-group\">\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Ryan Tompson\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-1.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Romina Hadid\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-2.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Alexander Smith\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-3.jpg\"\n                      />\n                    </a>\n\n                    <a\n                      class=\" avatar avatar-sm rounded-circle\"\n                      tooltip=\"Jessica Doe\"\n                      placement=\"top\"\n                      href=\"javascript:void(0)\"\n                    >\n                      <img\n                        alt=\"Image placeholder\"\n                        src=\"assets/img/theme/team-4.jpg\"\n                      />\n                    </a>\n                  </div>\n                </td>\n\n                <td>\n                  <div class=\" d-flex align-items-center\">\n                    <span class=\" completion mr-2\"> 100% </span>\n\n                    <div>\n                      <div class=\" progress\">\n                        <progressbar type=\"success\" [value]=\"100\">\n                        </progressbar>\n                      </div>\n                    </div>\n                  </div>\n                </td>\n\n                <td class=\" text-right\">\n                  <div class=\"dropdown no-caret\" dropdown [dropup]=\"'true'\">\n                    <a\n                      aria-controls=\"dropdown-basic\"\n                      class=\" btn btn-sm btn-icon-only text-light dropdown-toggle\"\n                      dropdownToggle\n                      href=\"javascript:void(0)\"\n                      role=\"button\"\n                    >\n                      <i class=\" fas fa-ellipsis-v\"> </i>\n                    </a>\n\n                    <div\n                      class=\"dropdown-menu dropdown-menu-right dropdown-menu-arrow\"\n                      *dropdownMenu\n                    >\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Another action\n                      </a>\n\n                      <a href=\"javascript:void(0)\" class=\"dropdown-item\">\n                        Something else here\n                      </a>\n                    </div>\n                  </div>\n                </td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n");

/***/ }),

/***/ "./node_modules/string-natural-compare/natural-compare.js":
/*!****************************************************************!*\
  !*** ./node_modules/string-natural-compare/natural-compare.js ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var alphabet;
var alphabetIndexMap;
var alphabetIndexMapLength = 0;

function isNumberCode(code) {
  return code >= 48 && code <= 57;
}

function naturalCompare(a, b) {
  var lengthA = (a += '').length;
  var lengthB = (b += '').length;
  var aIndex = 0;
  var bIndex = 0;

  while (aIndex < lengthA && bIndex < lengthB) {
    var charCodeA = a.charCodeAt(aIndex);
    var charCodeB = b.charCodeAt(bIndex);

    if (isNumberCode(charCodeA)) {
      if (!isNumberCode(charCodeB)) {
        return charCodeA - charCodeB;
      }

      var numStartA = aIndex;
      var numStartB = bIndex;

      while (charCodeA === 48 && ++numStartA < lengthA) {
        charCodeA = a.charCodeAt(numStartA);
      }
      while (charCodeB === 48 && ++numStartB < lengthB) {
        charCodeB = b.charCodeAt(numStartB);
      }

      var numEndA = numStartA;
      var numEndB = numStartB;

      while (numEndA < lengthA && isNumberCode(a.charCodeAt(numEndA))) {
        ++numEndA;
      }
      while (numEndB < lengthB && isNumberCode(b.charCodeAt(numEndB))) {
        ++numEndB;
      }

      var difference = numEndA - numStartA - numEndB + numStartB; // numA length - numB length
      if (difference) {
        return difference;
      }

      while (numStartA < numEndA) {
        difference = a.charCodeAt(numStartA++) - b.charCodeAt(numStartB++);
        if (difference) {
          return difference;
        }
      }

      aIndex = numEndA;
      bIndex = numEndB;
      continue;
    }

    if (charCodeA !== charCodeB) {
      if (
        charCodeA < alphabetIndexMapLength &&
        charCodeB < alphabetIndexMapLength &&
        alphabetIndexMap[charCodeA] !== -1 &&
        alphabetIndexMap[charCodeB] !== -1
      ) {
        return alphabetIndexMap[charCodeA] - alphabetIndexMap[charCodeB];
      }

      return charCodeA - charCodeB;
    }

    ++aIndex;
    ++bIndex;
  }

  if (aIndex >= lengthA && bIndex < lengthB && lengthA >= lengthB) {
    return -1;
  }

  if (bIndex >= lengthB && aIndex < lengthA && lengthB >= lengthA) {
    return 1;
  }

  return lengthA - lengthB;
}

naturalCompare.caseInsensitive = naturalCompare.i = function(a, b) {
  return naturalCompare(('' + a).toLowerCase(), ('' + b).toLowerCase());
};

Object.defineProperties(naturalCompare, {
  alphabet: {
    get: function() {
      return alphabet;
    },

    set: function(value) {
      alphabet = value;
      alphabetIndexMap = [];

      var i = 0;

      if (alphabet) {
        for (; i < alphabet.length; i++) {
          alphabetIndexMap[alphabet.charCodeAt(i)] = i;
        }
      }

      alphabetIndexMapLength = alphabetIndexMap.length;

      for (i = 0; i < alphabetIndexMapLength; i++) {
        if (alphabetIndexMap[i] === undefined) {
          alphabetIndexMap[i] = -1;
        }
      }
    },
  },
});

module.exports = naturalCompare;


/***/ }),

/***/ "./src/app/examples/tables/ngxdatatables/ngxdatatables.component.ts":
/*!**************************************************************************!*\
  !*** ./src/app/examples/tables/ngxdatatables/ngxdatatables.component.ts ***!
  \**************************************************************************/
/*! exports provided: SelectionType, NgxDatatablesComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectionType", function() { return SelectionType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NgxDatatablesComponent", function() { return NgxDatatablesComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm5/core.js");


var SelectionType;
(function (SelectionType) {
    SelectionType["single"] = "single";
    SelectionType["multi"] = "multi";
    SelectionType["multiClick"] = "multiClick";
    SelectionType["cell"] = "cell";
    SelectionType["checkbox"] = "checkbox";
})(SelectionType || (SelectionType = {}));
var NgxDatatablesComponent = /** @class */ (function () {
    function NgxDatatablesComponent() {
        this.entries = 10;
        this.selected = [];
        this.temp = [];
        this.rows = [
            {
                name: "Tiger Nixon",
                position: "System Architect",
                office: "Edinburgh",
                age: "61",
                start: "2011/04/25",
                salary: "$320,800"
            },
            {
                name: "Garrett Winters",
                position: "Accountant",
                office: "Tokyo",
                age: "63",
                start: "2011/07/25",
                salary: "$170,750"
            },
            {
                name: "Ashton Cox",
                position: "Junior Technical Author",
                office: "San Francisco",
                age: "66",
                start: "2009/01/12",
                salary: "$86,000"
            },
            {
                name: "Cedric Kelly",
                position: "Senior Javascript Developer",
                office: "Edinburgh",
                age: "22",
                start: "2012/03/29",
                salary: "$433,060"
            },
            {
                name: "Airi Satou",
                position: "Accountant",
                office: "Tokyo",
                age: "33",
                start: "2008/11/28",
                salary: "$162,700"
            },
            {
                name: "Brielle Williamson",
                position: "Integration Specialist",
                office: "New York",
                age: "61",
                start: "2012/12/02",
                salary: "$372,000"
            },
            {
                name: "Herrod Chandler",
                position: "Sales Assistant",
                office: "San Francisco",
                age: "59",
                start: "2012/08/06",
                salary: "$137,500"
            },
            {
                name: "Rhona Davidson",
                position: "Integration Specialist",
                office: "Tokyo",
                age: "55",
                start: "2010/10/14",
                salary: "$327,900"
            },
            {
                name: "Colleen Hurst",
                position: "Javascript Developer",
                office: "San Francisco",
                age: "39",
                start: "2009/09/15",
                salary: "$205,500"
            },
            {
                name: "Sonya Frost",
                position: "Software Engineer",
                office: "Edinburgh",
                age: "23",
                start: "2008/12/13",
                salary: "$103,600"
            },
            {
                name: "Jena Gaines",
                position: "Office Manager",
                office: "London",
                age: "30",
                start: "2008/12/19",
                salary: "$90,560"
            },
            {
                name: "Quinn Flynn",
                position: "Support Lead",
                office: "Edinburgh",
                age: "22",
                start: "2013/03/03",
                salary: "$342,000"
            },
            {
                name: "Charde Marshall",
                position: "Regional Director",
                office: "San Francisco",
                age: "36",
                start: "2008/10/16",
                salary: "$470,600"
            },
            {
                name: "Haley Kennedy",
                position: "Senior Marketing Designer",
                office: "London",
                age: "43",
                start: "2012/12/18",
                salary: "$313,500"
            },
            {
                name: "Tatyana Fitzpatrick",
                position: "Regional Director",
                office: "London",
                age: "19",
                start: "2010/03/17",
                salary: "$385,750"
            },
            {
                name: "Michael Silva",
                position: "Marketing Designer",
                office: "London",
                age: "66",
                start: "2012/11/27",
                salary: "$198,500"
            },
            {
                name: "Paul Byrd",
                position: "Chief Financial Officer (CFO)",
                office: "New York",
                age: "64",
                start: "2010/06/09",
                salary: "$725,000"
            },
            {
                name: "Gloria Little",
                position: "Systems Administrator",
                office: "New York",
                age: "59",
                start: "2009/04/10",
                salary: "$237,500"
            },
            {
                name: "Bradley Greer",
                position: "Software Engineer",
                office: "London",
                age: "41",
                start: "2012/10/13",
                salary: "$132,000"
            },
            {
                name: "Dai Rios",
                position: "Personnel Lead",
                office: "Edinburgh",
                age: "35",
                start: "2012/09/26",
                salary: "$217,500"
            },
            {
                name: "Jenette Caldwell",
                position: "Development Lead",
                office: "New York",
                age: "30",
                start: "2011/09/03",
                salary: "$345,000"
            },
            {
                name: "Yuri Berry",
                position: "Chief Marketing Officer (CMO)",
                office: "New York",
                age: "40",
                start: "2009/06/25",
                salary: "$675,000"
            },
            {
                name: "Caesar Vance",
                position: "Pre-Sales Support",
                office: "New York",
                age: "21",
                start: "2011/12/12",
                salary: "$106,450"
            },
            {
                name: "Doris Wilder",
                position: "Sales Assistant",
                office: "Sidney",
                age: "23",
                start: "2010/09/20",
                salary: "$85,600"
            },
            {
                name: "Angelica Ramos",
                position: "Chief Executive Officer (CEO)",
                office: "London",
                age: "47",
                start: "2009/10/09",
                salary: "$1,200,000"
            },
            {
                name: "Gavin Joyce",
                position: "Developer",
                office: "Edinburgh",
                age: "42",
                start: "2010/12/22",
                salary: "$92,575"
            },
            {
                name: "Jennifer Chang",
                position: "Regional Director",
                office: "Singapore",
                age: "28",
                start: "2010/11/14",
                salary: "$357,650"
            },
            {
                name: "Brenden Wagner",
                position: "Software Engineer",
                office: "San Francisco",
                age: "28",
                start: "2011/06/07",
                salary: "$206,850"
            },
            {
                name: "Fiona Green",
                position: "Chief Operating Officer (COO)",
                office: "San Francisco",
                age: "48",
                start: "2010/03/11",
                salary: "$850,000"
            },
            {
                name: "Shou Itou",
                position: "Regional Marketing",
                office: "Tokyo",
                age: "20",
                start: "2011/08/14",
                salary: "$163,000"
            },
            {
                name: "Michelle House",
                position: "Integration Specialist",
                office: "Sidney",
                age: "37",
                start: "2011/06/02",
                salary: "$95,400"
            },
            {
                name: "Suki Burks",
                position: "Developer",
                office: "London",
                age: "53",
                start: "2009/10/22",
                salary: "$114,500"
            },
            {
                name: "Prescott Bartlett",
                position: "Technical Author",
                office: "London",
                age: "27",
                start: "2011/05/07",
                salary: "$145,000"
            },
            {
                name: "Gavin Cortez",
                position: "Team Leader",
                office: "San Francisco",
                age: "22",
                start: "2008/10/26",
                salary: "$235,500"
            },
            {
                name: "Martena Mccray",
                position: "Post-Sales support",
                office: "Edinburgh",
                age: "46",
                start: "2011/03/09",
                salary: "$324,050"
            },
            {
                name: "Unity Butler",
                position: "Marketing Designer",
                office: "San Francisco",
                age: "47",
                start: "2009/12/09",
                salary: "$85,675"
            },
            {
                name: "Howard Hatfield",
                position: "Office Manager",
                office: "San Francisco",
                age: "51",
                start: "2008/12/16",
                salary: "$164,500"
            },
            {
                name: "Hope Fuentes",
                position: "Secretary",
                office: "San Francisco",
                age: "41",
                start: "2010/02/12",
                salary: "$109,850"
            },
            {
                name: "Vivian Harrell",
                position: "Financial Controller",
                office: "San Francisco",
                age: "62",
                start: "2009/02/14",
                salary: "$452,500"
            },
            {
                name: "Timothy Mooney",
                position: "Office Manager",
                office: "London",
                age: "37",
                start: "2008/12/11",
                salary: "$136,200"
            },
            {
                name: "Jackson Bradshaw",
                position: "Director",
                office: "New York",
                age: "65",
                start: "2008/09/26",
                salary: "$645,750"
            },
            {
                name: "Olivia Liang",
                position: "Support Engineer",
                office: "Singapore",
                age: "64",
                start: "2011/02/03",
                salary: "$234,500"
            },
            {
                name: "Bruno Nash",
                position: "Software Engineer",
                office: "London",
                age: "38",
                start: "2011/05/03",
                salary: "$163,500"
            },
            {
                name: "Sakura Yamamoto",
                position: "Support Engineer",
                office: "Tokyo",
                age: "37",
                start: "2009/08/19",
                salary: "$139,575"
            },
            {
                name: "Thor Walton",
                position: "Developer",
                office: "New York",
                age: "61",
                start: "2013/08/11",
                salary: "$98,540"
            },
            {
                name: "Finn Camacho",
                position: "Support Engineer",
                office: "San Francisco",
                age: "47",
                start: "2009/07/07",
                salary: "$87,500"
            },
            {
                name: "Serge Baldwin",
                position: "Data Coordinator",
                office: "Singapore",
                age: "64",
                start: "2012/04/09",
                salary: "$138,575"
            },
            {
                name: "Zenaida Frank",
                position: "Software Engineer",
                office: "New York",
                age: "63",
                start: "2010/01/04",
                salary: "$125,250"
            },
            {
                name: "Zorita Serrano",
                position: "Software Engineer",
                office: "San Francisco",
                age: "56",
                start: "2012/06/01",
                salary: "$115,000"
            },
            {
                name: "Jennifer Acosta",
                position: "Junior Javascript Developer",
                office: "Edinburgh",
                age: "43",
                start: "2013/02/01",
                salary: "$75,650"
            },
            {
                name: "Cara Stevens",
                position: "Sales Assistant",
                office: "New York",
                age: "46",
                start: "2011/12/06",
                salary: "$145,600"
            },
            {
                name: "Hermione Butler",
                position: "Regional Director",
                office: "London",
                age: "47",
                start: "2011/03/21",
                salary: "$356,250"
            },
            {
                name: "Lael Greer",
                position: "Systems Administrator",
                office: "London",
                age: "21",
                start: "2009/02/27",
                salary: "$103,500"
            },
            {
                name: "Jonas Alexander",
                position: "Developer",
                office: "San Francisco",
                age: "30",
                start: "2010/07/14",
                salary: "$86,500"
            },
            {
                name: "Shad Decker",
                position: "Regional Director",
                office: "Edinburgh",
                age: "51",
                start: "2008/11/13",
                salary: "$183,000"
            },
            {
                name: "Michael Bruce",
                position: "Javascript Developer",
                office: "Singapore",
                age: "29",
                start: "2011/06/27",
                salary: "$183,000"
            },
            {
                name: "Donna Snider",
                position: "Customer Support",
                office: "New York",
                age: "27",
                start: "2011/01/25",
                salary: "$112,000"
            }
        ];
        this.SelectionType = SelectionType;
        this.temp = this.rows.map(function (prop, key) {
            return Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])(Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__assign"])({}, prop), { id: key });
        });
    }
    NgxDatatablesComponent.prototype.entriesChange = function ($event) {
        this.entries = $event.target.value;
    };
    NgxDatatablesComponent.prototype.filterTable = function ($event) {
        var val = $event.target.value;
        this.temp = this.rows.filter(function (d) {
            for (var key in d) {
                if (d[key].toLowerCase().indexOf(val) !== -1) {
                    return true;
                }
            }
            return false;
        });
    };
    NgxDatatablesComponent.prototype.onSelect = function (_a) {
        var _b;
        var selected = _a.selected;
        this.selected.splice(0, this.selected.length);
        (_b = this.selected).push.apply(_b, selected);
    };
    NgxDatatablesComponent.prototype.onActivate = function (event) {
        this.activeRow = event.row;
    };
    NgxDatatablesComponent.prototype.ngOnInit = function () { };
    NgxDatatablesComponent = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: "app-ngxdatatables",
            template: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__importDefault"])(__webpack_require__(/*! raw-loader!./ngxdatatables.component.html */ "./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/ngxdatatables/ngxdatatables.component.html")).default
        }),
        Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"])("design:paramtypes", [])
    ], NgxDatatablesComponent);
    return NgxDatatablesComponent;
}());



/***/ }),

/***/ "./src/app/examples/tables/sortable/sortable.component.ts":
/*!****************************************************************!*\
  !*** ./src/app/examples/tables/sortable/sortable.component.ts ***!
  \****************************************************************/
/*! exports provided: SortableComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SortableComponent", function() { return SortableComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm5/core.js");
/* harmony import */ var list_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! list.js */ "./node_modules/list.js/src/index.js");
/* harmony import */ var list_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(list_js__WEBPACK_IMPORTED_MODULE_2__);



var SortableComponent = /** @class */ (function () {
    function SortableComponent() {
    }
    SortableComponent.prototype.ngOnInit = function () {
        new list_js__WEBPACK_IMPORTED_MODULE_2___default.a(document.getElementById("first-list"), {
            valueNames: ["name", "budget", "status", "completion"],
            listClass: "list"
        });
        new list_js__WEBPACK_IMPORTED_MODULE_2___default.a(document.getElementById("second-list"), {
            valueNames: ["name", "budget", "status", "completion"],
            listClass: "list"
        });
        new list_js__WEBPACK_IMPORTED_MODULE_2___default.a(document.getElementById("third-list"), {
            valueNames: ["name", "budget", "status", "completion"],
            listClass: "list"
        });
    };
    SortableComponent = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: "app-sortable",
            template: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__importDefault"])(__webpack_require__(/*! raw-loader!./sortable.component.html */ "./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/sortable/sortable.component.html")).default
        }),
        Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"])("design:paramtypes", [])
    ], SortableComponent);
    return SortableComponent;
}());



/***/ }),

/***/ "./src/app/examples/tables/tables.module.ts":
/*!**************************************************!*\
  !*** ./src/app/examples/tables/tables.module.ts ***!
  \**************************************************/
/*! exports provided: TablesModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TablesModule", function() { return TablesModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/__ivy_ngcc__/fesm5/common.js");
/* harmony import */ var ngx_bootstrap_progressbar__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ngx-bootstrap/progressbar */ "./node_modules/ngx-bootstrap/__ivy_ngcc__/progressbar/fesm5/ngx-bootstrap-progressbar.js");
/* harmony import */ var ngx_bootstrap__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ngx-bootstrap */ "./node_modules/ngx-bootstrap/__ivy_ngcc__/esm5/ngx-bootstrap.js");
/* harmony import */ var ngx_bootstrap_pagination__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ngx-bootstrap/pagination */ "./node_modules/ngx-bootstrap/__ivy_ngcc__/pagination/fesm5/ngx-bootstrap-pagination.js");
/* harmony import */ var ngx_bootstrap_tooltip__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ngx-bootstrap/tooltip */ "./node_modules/ngx-bootstrap/__ivy_ngcc__/tooltip/fesm5/ngx-bootstrap-tooltip.js");
/* harmony import */ var _swimlane_ngx_datatable__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @swimlane/ngx-datatable */ "./node_modules/@swimlane/ngx-datatable/__ivy_ngcc__/fesm5/swimlane-ngx-datatable.js");
/* harmony import */ var ngx_print__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ngx-print */ "./node_modules/ngx-print/__ivy_ngcc__/fesm5/ngx-print.js");
/* harmony import */ var _ngxdatatables_ngxdatatables_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./ngxdatatables/ngxdatatables.component */ "./src/app/examples/tables/ngxdatatables/ngxdatatables.component.ts");
/* harmony import */ var _tables_tables_component__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./tables/tables.component */ "./src/app/examples/tables/tables/tables.component.ts");
/* harmony import */ var _sortable_sortable_component__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./sortable/sortable.component */ "./src/app/examples/tables/sortable/sortable.component.ts");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/__ivy_ngcc__/fesm5/router.js");
/* harmony import */ var _tables_routing__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./tables.routing */ "./src/app/examples/tables/tables.routing.ts");














var TablesModule = /** @class */ (function () {
    function TablesModule() {
    }
    TablesModule = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"])({
            declarations: [_ngxdatatables_ngxdatatables_component__WEBPACK_IMPORTED_MODULE_9__["NgxDatatablesComponent"], _sortable_sortable_component__WEBPACK_IMPORTED_MODULE_11__["SortableComponent"], _tables_tables_component__WEBPACK_IMPORTED_MODULE_10__["TablesComponent"]],
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_2__["CommonModule"],
                _angular_router__WEBPACK_IMPORTED_MODULE_12__["RouterModule"].forChild(_tables_routing__WEBPACK_IMPORTED_MODULE_13__["TablesRoutes"]),
                _swimlane_ngx_datatable__WEBPACK_IMPORTED_MODULE_7__["NgxDatatableModule"],
                ngx_bootstrap_progressbar__WEBPACK_IMPORTED_MODULE_3__["ProgressbarModule"].forRoot(),
                ngx_bootstrap__WEBPACK_IMPORTED_MODULE_4__["BsDropdownModule"].forRoot(),
                ngx_bootstrap_pagination__WEBPACK_IMPORTED_MODULE_5__["PaginationModule"].forRoot(),
                ngx_bootstrap_tooltip__WEBPACK_IMPORTED_MODULE_6__["TooltipModule"].forRoot(),
                ngx_print__WEBPACK_IMPORTED_MODULE_8__["NgxPrintModule"]
            ]
        })
    ], TablesModule);
    return TablesModule;
}());



/***/ }),

/***/ "./src/app/examples/tables/tables.routing.ts":
/*!***************************************************!*\
  !*** ./src/app/examples/tables/tables.routing.ts ***!
  \***************************************************/
/*! exports provided: TablesRoutes */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TablesRoutes", function() { return TablesRoutes; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _ngxdatatables_ngxdatatables_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ngxdatatables/ngxdatatables.component */ "./src/app/examples/tables/ngxdatatables/ngxdatatables.component.ts");
/* harmony import */ var _sortable_sortable_component__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./sortable/sortable.component */ "./src/app/examples/tables/sortable/sortable.component.ts");
/* harmony import */ var _tables_tables_component__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tables/tables.component */ "./src/app/examples/tables/tables/tables.component.ts");




var TablesRoutes = [
    {
        path: "",
        children: [
            {
                path: "ngx-datatable",
                component: _ngxdatatables_ngxdatatables_component__WEBPACK_IMPORTED_MODULE_1__["NgxDatatablesComponent"]
            }
        ]
    },
    {
        path: "",
        children: [
            {
                path: "sortable",
                component: _sortable_sortable_component__WEBPACK_IMPORTED_MODULE_2__["SortableComponent"]
            }
        ]
    },
    {
        path: "",
        children: [
            {
                path: "tables",
                component: _tables_tables_component__WEBPACK_IMPORTED_MODULE_3__["TablesComponent"]
            }
        ]
    }
];


/***/ }),

/***/ "./src/app/examples/tables/tables/tables.component.ts":
/*!************************************************************!*\
  !*** ./src/app/examples/tables/tables/tables.component.ts ***!
  \************************************************************/
/*! exports provided: TablesComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TablesComponent", function() { return TablesComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/__ivy_ngcc__/fesm5/core.js");


var TablesComponent = /** @class */ (function () {
    function TablesComponent() {
    }
    TablesComponent.prototype.ngOnInit = function () { };
    TablesComponent = Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"])([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: "app-tables",
            template: Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__importDefault"])(__webpack_require__(/*! raw-loader!./tables.component.html */ "./node_modules/raw-loader/dist/cjs.js!./src/app/examples/tables/tables/tables.component.html")).default
        }),
        Object(tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"])("design:paramtypes", [])
    ], TablesComponent);
    return TablesComponent;
}());



/***/ })

}]);
//# sourceMappingURL=examples-tables-tables-module.js.map