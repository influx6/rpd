function applyCodeExample1() {
    Rpd.renderNext('svg', document.getElementById('example-one'),
                   { style: 'compact-v' });

    var patch = Rpd.addPatch('Generate Random Numbers').resizeCanvas(800, 110);

    // add Metro Node, it may generate `bang` signal with the requested time interval
    var metroNode = patch.addNode('util/metro', 'Metro').move(40, 10);

    // add Random Generator Node that will generate random numbers on every `bang` signal
    var randomGenNode = patch.addNode('util/random', 'Random').move(130, 20);
    randomGenNode.inlets['max'].receive(26); // set maximum value of the generated numbers

    // add Log Node, which will log last results of the Random Generator Node
    var logRandomNode = patch.addNode('util/log', 'Log').move(210, 60);
    randomGenNode.outlets['out'].connect(logRandomNode.inlets['what']);

    // define the type of the node which multiplies the incoming value on two
    var multiplyTwoNode = patch.addNode('core/basic', '* 2', {
        process: function(inlets) {
            return {
                'result': (inlets.multiplier || 0) * 2
            }
        }
    }).move(240, 10);
    var multiplierInlet = multiplyTwoNode.addInlet('util/number', 'multiplier');
    var resultOutlet = multiplyTwoNode.addOutlet('util/number', 'result');

    // connect Random Generator output to the multiplying node
    var logMultiplyNode = patch.addNode('util/log', 'Log').move(370, 20);
    resultOutlet.connect(logMultiplyNode.inlets['what']);

    // connect Random Generator output to the multiplying node
    randomGenNode.outlets['out'].connect(multiplierInlet);

    // finally connect Metro node to Random Generator, so the sequence starts
    metroNode.outlets['out'].connect(randomGenNode.inlets['bang']);
}

function applyCodeExample2() {
    var patch = {};

    Rpd.channeltype('my/vector', {
      show: function(val) {
      	return '<' + val.x + ':' + val.y + '>';
      }
    });

    Rpd.nodetype('my/vector', {
      inlets: {
        x: { type: 'util/number', default: 0 },
        y: { type: 'util/number', default: 0 }
      },
      outlets: {
        out: { type: 'util/number' }
      },
      process: function(inlets) {
        return { x: inlets.x, y: inlets.y };
      }
    });

    Rpd.nodetype('my/canvas', {
      inlets: {
        from: { type: 'util/color' },
        to: { type: 'util/color' },
        count: { type: 'util/number', default: 5 },
        target: { type: 'my/vector' }
      },
      process: function() {}
    });

    var SVG_XMLNS = 'http://www.w3.org/2000/svg';

    Rpd.noderenderer('my/canvas', 'svg', function() {
      var context;
      var particles = [];
      var lastCount = 0;

      function draw() {
        if (context) {
          context.fillStyle = '#fff';
          context.fillRect(0, 0, 150, 150);
          context.fillStyle = '#000';
          particles.forEach(function(particle) {
            context.fillRect(Math.random() * 150, Math.random() * 150, 20, 20);
          });
        }
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);

      return {
        size: { width: 150, height: 150 },
        pivot: { x: 0, y: 0 },

        first: function(bodyElm) {
          var group = document.createElementNS(SVG_XMLNS, 'g');
          group.setAttributeNS(null, 'transform', 'translate(10, 10)');
          var foreign = document.createElementNS(SVG_XMLNS, 'foreignObject');
          canvas = document.createElement('canvas');
          canvas.setAttributeNS(null, 'width', '130px');
          canvas.setAttributeNS(null, 'height', '130px');
          canvas.style.position = 'fixed';
          foreign.appendChild(canvas);
          group.appendChild(foreign);
          bodyElm.appendChild(group);

          context = canvas.getContext('2d');
        },

        always: function(bodyElm, inlets) {
          if (inlets.count != lastCount) {
            particles = [];
            for (var i = 0; i < inlets.count; i++) {
              particles.push({});
            }
            lastCount = inlets.count;
          }
        }

      };
    });

    patch.addNode('util/color');
    patch.addNode('util/color');
    patch.addNode('my/vector');
    patch.addNode('my/canvas');
    patch.addNode('util/knob');
}

applyCodeExample1();

var logoPatchAdded = false;
document.getElementById('planets').addEventListener('click', function() {
    if (logoPatchAdded) return;
    logoPatchAdded = true;
    applyRpdLogoPatch(document.getElementById('rpd-logo'),
                      document.getElementById('planets'),
                      document.getElementById('patch-target'));
});

var stringFromCharCode = String.fromCharCode;
var floor = Math.floor;
function fromCodePoint(_) {
    // https://github.com/mathiasbynens/String.fromCodePoint/blob/master/fromcodepoint.js
    var MAX_SIZE = 0x4000;
    var codeUnits = [];
    var highSurrogate;
    var lowSurrogate;
    var index = -1;
    var length = arguments.length;
    if (!length) {
        return '';
    }
    var result = '';
    while (++index < length) {
        var codePoint = Number(arguments[index]);
        if (
            !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
            codePoint < 0 || // not a valid Unicode code point
            codePoint > 0x10FFFF || // not a valid Unicode code point
            floor(codePoint) != codePoint // not an integer
        ) {
            throw RangeError('Invalid code point: ' + codePoint);
        }
        if (codePoint <= 0xFFFF) { // BMP code point
            codeUnits.push(codePoint);
        } else { // Astral code point; split in surrogate halves
            // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000;
            highSurrogate = (codePoint >> 10) + 0xD800;
            lowSurrogate = (codePoint % 0x400) + 0xDC00;
            codeUnits.push(highSurrogate, lowSurrogate);
        }
        if (index + 1 == length || codeUnits.length > MAX_SIZE) {
            result += stringFromCharCode.apply(null, codeUnits);
            codeUnits.length = 0;
        }
    }
    return result;
}
