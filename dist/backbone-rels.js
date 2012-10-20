// Generated by CoffeeScript 1.3.3
(function() {
  var Rels, bind, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = this._ || require('underscore');

  bind = function(Backbone) {
    var Collection, Model, getCtor;
    if (Backbone == null) {
      Backbone = this.Backbone || require('backbone');
    }
    Model = (function(_super) {

      __extends(Model, _super);

      function Model() {
        return Model.__super__.constructor.apply(this, arguments);
      }

      Model.cache = function() {
        return this._cache || (this._cache = new this.Collection);
      };

      Model.prototype.cache = function() {
        return this.constructor.cache();
      };

      Model["new"] = function(attrs) {
        var model;
        model = this.cache().get(this.prototype._generateId(attrs));
        return (model != null ? model.set.apply(model, arguments) : void 0) || (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args), t = typeof result;
          return t == "object" || t == "function" ? result || child : child;
        })(this, arguments, function(){});
      };

      Model.prototype["new"] = function() {
        var _ref;
        return (_ref = this.constructor)["new"].apply(_ref, arguments);
      };

      Model.prototype.initialize = function() {
        Model.__super__.initialize.apply(this, arguments);
        this._previousId = this.id = this._generateId();
        if (this.cacheAll) {
          this.cache().add(this);
        }
        return this._hookRels();
      };

      Model.prototype._generateId = function(attrs) {
        var index, val, vals, _i, _len, _ref;
        if (attrs == null) {
          attrs = this.attributes;
        }
        if (!this.compositeKey) {
          return attrs[this.idAttribute];
        }
        vals = [];
        _ref = this.compositeKey;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          index = _ref[_i];
          if ((val = attrs[index]) == null) {
            return void 0;
          }
          vals.push(val);
        }
        return vals.join('-');
      };

      Model.prototype._hookRels = function() {
        var name, rel, _ref, _results;
        if (!this.rels) {
          return;
        }
        this.get = _.bind(this.get, this);
        this.set = _.bind(this.set, this);
        _ref = this.rels;
        _results = [];
        for (name in _ref) {
          rel = _ref[name];
          if (rel.hasOne) {
            _results.push(this._hookHasOne(name, rel));
          } else if (rel.via) {
            _results.push(this._hookHasManyVia(name, rel));
          } else {
            _results.push(this._hookHasMany(name, rel));
          }
        }
        return _results;
      };

      Model.prototype._hookHasOne = function(name, rel) {
        var ctor, mine, onChangeId, onChangeMine, onDestroy,
          _this = this;
        ctor = getCtor(rel.hasOne);
        mine = rel.myFk;
        onChangeId = function() {
          return _this.set(mine, _this.get[name].id);
        };
        onDestroy = function() {
          delete _this.get[name];
          if (rel.romeo) {
            return _this.trigger('destroy', _this, _this.collection);
          } else {
            return _this.set(mine, null);
          }
        };
        this.set[name] = function(next) {
          var prev;
          prev = _this.get[name];
          if (next === prev) {
            return;
          }
          if (prev) {
            prev.off('change:id', onChangeId);
            prev.off('destroy', onDestroy);
          }
          _this.get[name] = next;
          _this.set(mine, next != null ? next.id : void 0);
          if (next) {
            next.on('change:id', onChangeId);
            return next.on('destroy', onDestroy);
          }
        };
        (onChangeMine = function() {
          return _this.set[name](ctor.cache().get(_this.get(mine)));
        })();
        this.on("change:" + mine, onChangeMine);
        return ctor.cache().on('add', function(model) {
          if (model.id === _this.get(mine)) {
            return _this.set[name](model);
          }
        });
      };

      Model.prototype._hookHasMany = function(name, rel) {
        var ctor, models, theirs,
          _this = this;
        ctor = getCtor(rel.hasMany);
        theirs = rel.theirFk;
        models = this.get[name] = new ctor.Collection;
        models.url = function() {
          return "" + (_.result(_this, 'url')) + (_.result(rel.url) || ("/" + name));
        };
        (models.filters = {})[theirs] = this;
        ctor.cache().on("add change:" + theirs, function(model) {
          if (_this.id === model.get(theirs)) {
            return models.add(model);
          }
        });
        models.on("change:" + theirs, function(model) {
          return models.remove(model);
        });
        return models.add(ctor.cache().filter(function(model) {
          return _this.id === model.get(theirs);
        }));
      };

      Model.prototype._hookHasManyVia = function(name, rel) {
        var attributes, ctor, mine, models, theirs, via, viaCtor,
          _this = this;
        ctor = getCtor(rel.hasMany);
        viaCtor = getCtor(rel.via);
        mine = rel.myViaFk;
        theirs = rel.theirViaFk;
        models = this.get[name] = new ctor.Collection;
        models.url = function() {
          return "" + (_.result(_this, 'url')) + (_.result(rel.url) || ("/" + name));
        };
        models.mine = theirs;
        via = models.via = new viaCtor.Collection;
        via.url = function() {
          return "" + (_.result(_this, 'url')) + (_.result(viaCtor.Collection.prototype, 'url'));
        };
        (via.filters = {})[mine] = this;
        attributes = {};
        viaCtor.cache().on('add', function(model) {
          if (_this.id === model.get(mine)) {
            return via.add(model);
          }
        });
        via.on('add', function(model) {
          return models.add(ctor["new"]({
            id: model.get(theirs)
          }));
        }).on('remove', function(model) {
          return models.remove(models.get(model.get(theirs)));
        });
        ctor.cache().on('add', function(model) {
          attributes[mine] = this.id;
          attributes[theirs] = model.id;
          if (via.get(viaCtor.prototype._generateId(attributes))) {
            return models.add(model);
          }
        });
        models.on('add', function(model) {
          attributes[mine] = _this.id;
          attributes[theirs] = model.id;
          return via.add(viaCtor["new"](attributes));
        }).on('remove', function(model) {
          attributes[mine] = _this.id;
          attributes[theirs] = model.id;
          return via.remove(via.get(viaCtor.prototype._generateId(attributes)));
        });
        return via.add(viaCtor.cache().filter(function(model) {
          return _this.id === model.get(mine);
        }));
      };

      Model.prototype.via = function(rel, id) {
        var attributes, viaCtor;
        if (!((id != null ? id.id : void 0) ? id = id.id : void 0)) {
          return;
        }
        viaCtor = getCtor(this.rels[rel].via);
        (attributes = {})[this.rels[rel].myViaFk] = this.id;
        attributes[this.rels[rel].theirViaFk] = id;
        return this.get[rel].via.get(viaCtor.prototype._generateId(attributes));
      };

      Model.prototype.change = function() {
        this._previousId = this.id;
        this.id = this._generateId();
        return Model.__super__.change.apply(this, arguments);
      };

      return Model;

    })(Backbone.Model);
    Collection = (function(_super) {

      __extends(Collection, _super);

      function Collection() {
        return Collection.__super__.constructor.apply(this, arguments);
      }

      Collection.prototype.model = Model;

      Collection.prototype._onModelEvent = function(event, model, collection, options) {
        if (model && event === 'change' && model.id !== model._previousId) {
          delete this._byId[model._previousId];
          if (model.id != null) {
            this._byId[model.id] = model;
          }
        }
        return Collection.__super__._onModelEvent.apply(this, arguments);
      };

      Collection.prototype.fetch = function(options) {
        var success,
          _this = this;
        options = _.extend({
          error: function() {}
        }, options);
        success = options.success;
        options.merge = true;
        options.success = function(resp, status, xhr) {
          var attrs, ids, models;
          models = (function() {
            var _i, _len, _ref, _results;
            _ref = this.parse(resp);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              attrs = _ref[_i];
              _results.push(this.model["new"](attrs));
            }
            return _results;
          }).call(_this);
          ids = _.pluck(models, 'id');
          if (!options.add) {
            _this.remove(_this.reject(function(model) {
              var _ref;
              return _ref = model.id, __indexOf.call(ids, _ref) >= 0;
            }));
          }
          _this.add(models, options);
          if (typeof success === "function") {
            success(_this, resp, options);
          }
          return _this.trigger('sync', _this, resp, options);
        };
        return (this.sync || Backbone.sync)('read', this, options);
      };

      Collection.prototype.save = function(options) {
        var success,
          _this = this;
        options = options ? _.clone(options) : {};
        success = options.success;
        if (!this.length) {
          return typeof success === "function" ? success(this, [], options) : void 0;
        }
        options.success = function(resp, status, xhr) {
          var attrs, _i, _len, _ref, _ref1;
          _ref = _this.parse(resp);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            attrs = _ref[_i];
            if ((_ref1 = _this.get(attrs.id)) != null) {
              _ref1.set(attrs, options);
            }
          }
          if (typeof success === "function") {
            success(_this, resp, options);
          }
          return _this.trigger('sync', _this, resp, options);
        };
        return (this.sync || Backbone.sync)('update', this, options);
      };

      Collection.prototype.destroy = function(options) {
        var success;
        options = options ? _.clone(options) : {};
        success = options.success;
        if (!this.length) {
          return typeof success === "function" ? success(this, [], options) : void 0;
        }
        options.success = function(resp) {
          var model, _i, _len, _ref;
          _ref = this.models;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            model = _ref[_i];
            model.trigger('destroy', model, model.collection, options);
          }
          if (typeof success === "function") {
            success(this, resp, options);
          }
          return this.trigger('sync', this, resp, options);
        };
        return (this.sync || Backbone.sync)('delete', this, options);
      };

      return Collection;

    })(Backbone.Collection);
    getCtor = function(val) {
      if (val instanceof Model) {
        return val;
      } else {
        return val();
      }
    };
    return Backbone.Rels = {
      Model: Model,
      Collection: Collection
    };
  };

  ((typeof module !== "undefined" && module !== null) && module || {}).exports = Rels = function(Backbone) {
    return _.extend(this.constructor, bind(Backbone));
  };

  _.extend(Rels, bind());

}).call(this);
