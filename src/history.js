Rpd.history = (function() {

    var undoMap = {
        'patch/add-node': function(history, update) {
            update.patch.removeNode(update.node);
        },
        'patch/remove-node': function(history, update) {
            update.patch.addNode(update.node.type, update.node.def.title, update.node.def);
        },
        'patch/open': function(history, update) {
            update.patch.close();
        },
        'patch/close': function(history, update) {
            update.patch.open(update.parent);
        },
        'node/add-inlet': function(history, update) {
            update.node.removeInlet(update.inlet);
        },
        'node/add-outlet': function(history, update) {
            update.node.removeOutlet(update.outlet);
        },
        'node/remove-inlet': function(history, update) {
            update.node.addInlet(update.inlet.type, update.inlet.alias, update.inlet.def);
        },
        'node/remove-outlet': function(history, update) {
            update.node.addOutlet(update.outlet.type, update.outlet.alias, update.outlet.def);
        },
        'outlet/connect': function(history, update) {
            update.outlet.disconnect(update.link);
        },
        'outlet/disconnect': function(history, update) {
            update.outlet.connect(update.link.inlet);
        },
        'link/enable': function(history, update) {
            update.link.disable();
        },
        'link/disable': function(history, update) {
            update.link.enable();
        }
    };

    var redoMap = {
        'patch/add-node': function(history, update) {
            history.nodes[update.node.id] = update.patch.addNode(update.node.type, update.node.def.title, update.node.def);
        },
        'patch/remove-node': function(history, update) {
            var node = history.nodes[update.node.id] || update.node;
            update.patch.removeNode(node);
        },
        'patch/open': function(history, update) {
            update.patch.open(update.parent);
        },
        'patch/close': function(history, update) {
            update.patch.close();
        },
        'node/add-inlet': function(history, update) {
            var node = history.nodes[update.node.id] || update.node;
            history.inlets[update.inlet.id] =
                node.addInlet(update.inlet.type, update.inlet.alias, update.inlet.def);
        },
        'node/add-outlet': function(history, update) {
            var node = history.nodes[update.node.id] || update.node;
            history.outlets[update.outlet.id] =
                node.addOutlet(update.outlet.type, update.outlet.alias, update.outlet.def);
        },
        'node/remove-inlet': function(history, update) {
            var node  = history.nodes[update.node.id]   || update.node;
            var inlet = history.inlets[update.inlet.id] || update.inlet;
            node.removeInlet(inlet);
        },
        'node/remove-outlet': function(history, update) {
            var node   = history.nodes[update.node.id]     || update.node;
            var outlet = history.outlets[update.outlet.id] || update.outlet;
            node.removeOutlet(outlet);
        },
        'outlet/connect': function(history, update) {
            var inlet  = history.inlets[update.inlet.id]   || update.inlet;
            var outlet = history.outlets[update.outlet.id] || update.outlet;
            history.links[update.link.id] = outlet.connect(inlet);
        },
        'outlet/disconnect': function(history, update) {
            var outlet = history.nodes[update.outlet.id] || update.outlet;
            var link   = history.links[update.link.id]   || update.link;
            outlet.disconnect(link);
        },
        'link/enable': function(history, update) {
            (history.links[update.link.id] || update.link).enable();
        },
        'link/disable': function(history, update) {
            (history.links[update.link.id] || update.link).disable();
        }
    };

    function checkStackLimit(stack, limit) {
        if (stack.length > limit) stack.shift();
    }

    function stackInfo(alias, stack) {
        console.log(alias);
        stack.forEach(function(item) {
            console.log(item.type, item);
        })
    }

    var DEFAULT_LIMIT = 50;

    function History() {
        this.limit = DEFAULT_LIMIT;
        this.reset();
        Rpd.events.filter(function(update) {
            return undoMap[update.type];
        }).onValue(function(update) {
            if (this.lockUndoStack) return;
            checkStackLimit(this.undoStack, this.limit);
            this.undoStack.push(update);
        }.bind(this));
    }

    History.prototype.reset = function() {
        this.undoStack = [];
        this.redoStack = [];
        this.lockUndoStack = false;

        this.nodes = {};
        this.inlets = {};
        this.outlets = {};
        this.links = {};
    }

    History.prototype.undo = function() {
        console.log('UNDO');
        var lastAction = this.undoStack.pop();
        console.log('last action', lastAction.type);
        if (!lastAction) return;
        var reversedAction = undoMap[lastAction.type];
        if (reversedAction) {
            this.lockUndoStack = true;
            reversedAction(this, lastAction);
            this.lockUndoStack = false;
            checkStackLimit(this.redoStack, this.limit);
            this.redoStack.push(lastAction);
        }
    }

    History.prototype.redo = function() {
        console.log('REDO');
        var lastAction = this.redoStack.pop();
        if (!lastAction) return;
        console.log('last action', lastAction.type);
        var repeatingAction = redoMap[lastAction.type];
        if (repeatingAction) {
            repeatingAction(this, lastAction);
        }
    }

    History.prototype.changeLimit = function(limit) {
        this.limit = limit;
    }

    History.prototype.getUndoRecordCount = function() {
        return this.undoStack.length;
    }

    History.prototype.getRedoRecordCount = function() {
        return this.redoStack.length;
    }

    return new History();

})();