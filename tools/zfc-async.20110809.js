// ZFC asynchronous JavaScript library

function ZFC() {};

ZFC.prototype = {
  initialize: function(pTime, eTime, uLabel, uHost, uURI, uUUID, pUUID) {
    this.pageGenTime    = pTime;  // page gen time
    this.enterHeadTime  = eTime;  // enter head time
    this.leaveBodyTime  = null;   // leave body time
    this.upstreamLabel  = uLabel; // zfc upstream label
    this.upstreamHost   = uHost;  // upstream host header
    this.upstreamURI    = uURI;   // upstream URI
    this.upstreamUUID   = uUUID;  // upstream UUID
    this.metadata       = null;   // upstream metadata
    this.eventUrl       = null;   // event pixel URL
    this.eventCounter   = 1;      // event bundle counter
    this.eventList      = [];     // event list
    this.uuid           = pUUID;  // client-side UUID
    this.checkPointList = [];     // user-defined checkpoints
    this.errors         = [];     // javascript errors
  },

  push: function (args) {
    var method = args.shift();
    this[method].apply(this, args);
  },

  // Method to serialize a 32-bit unsigned int in protobuf varint format
  writeVarint: function(s, value) {
    do { 
      if (value >= 0x80) {
        s += String.fromCharCode((value & 0x7f) | 0x80);
      } else {
        s += String.fromCharCode(value);
      }
    } while ((value >>>= 7));
    return s;
  },

  // Method to serialize a protobuf field in varint format
  writeVarintField: function(s, field, value) {
    s = this.writeVarint(s, field << 3);
    s = this.writeVarint(s, value);
    return s;
  },

  // Method to serialize a protobuf field in binary format
  writeBinaryField: function(s, field, value) {
    s = this.writeVarint(s, field << 3 | 2);
    s = this.writeVarint(s, value.length);
    s += value;
    return s;
  },

  // Method to serialize a date (represented as milliseconds since Jan
  // 1, 1970) as a pair of varints with given field numbers.  Sadly,
  // we can't just serialize it as a uint64, since JavaScript's bit
  // operators truncate the operands to 32 bits.
  writeDTimeFields: function(s, field1, field2, date) {
    var sval = '' + date;
    var time = sval.substring(0, sval.length - 3);
    var msec = sval.substring(sval.length - 3, sval.length);
    s = this.writeVarintField(s, field1, time);
    s = this.writeVarintField(s, field2, msec);
    return s;
  },

  // Method to base64 encode a string
  base64Encode: function(s) {
    var e = window.__ =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var c0, c1, c2;
    var len = s.length;
    var pos = 0;
    var enc = '';

    while (len > 2) {
      c0 = s.charCodeAt(pos++);
      c1 = s.charCodeAt(pos++);
      c2 = s.charCodeAt(pos++);
      enc += e.charAt((c0 >>> 2) & 0x3f);
      enc += e.charAt(((c0 & 0x03) << 4) | (c1 >>> 4));
      enc += e.charAt(((c1 & 0x0f) << 2) | (c2 >>> 6));
      enc += e.charAt(c2 & 0x3f);
      len -= 3;
    }

    if (len) {
      c0 = s.charCodeAt(pos++);
      enc += e.charAt((c0 >>> 2) & 0x3f);
      if (len == 1) {
        enc += e.charAt((c0 & 0x03) << 4);
        enc += '=';
      } else {
        c1 = s.charCodeAt(pos++);
        enc += e.charAt(((c0 & 0x03) << 4) | (c1 >>> 4));
        enc += e.charAt((c1 & 0x0f) << 2);
      }
      enc += '=';
    }

    return enc;
  },

  // Optional upstream metadata to associate with page views
  setMetaData: function(val) {
    this.metadata = val;
  },

  // Optional event pixel URL
  setEventUrl: function(val) {
    this.eventUrl = val;
  },

  // Add an event to the event list
  addEvent: function(type, payload, metadata) {
    this.eventList.push(this.eventMessage(type, payload, metadata));
  },

  // Add a checkpoint to the checkpoint list
  addCheckPoint: function(date, label) {
    this.checkPointList.push(this.checkPointMessage(date, label));
  },

  // Add a javascript error
  addError: function(msg, url, line) {
    this.errors.push(this.errorMessage(msg, url, line));
  },

  // Take the leave-body timestamp
  leaveBody: function(time) {
    this.leaveBodyTime = time;
  },

  // Lazy-load a client-side UUID to tie pixels together
  getUUID: function(callback) {
    if (!this.uuid) {
      var q = function() {
        return (((1+Math.random())*(1<<16))|0).toString(16).substring(1);
      };
      this.uuid =
        q() + q() + "-" + q() + "-" + q() + "-" + q() + "-" + q() + q() + q();
    }

    if (callback) {
      callback(this.uuid);
    }

    return this.uuid;
  },

  // Method to build an Onload.Checkpoint submessage
  checkPointMessage: function(date, label) {
    var msg = '';
    if (label != null) {
      msg = this.writeBinaryField(msg, 1, label);
    }
    msg = this.writeDTimeFields(msg, 2, 3, date);
    return msg;
  },

  // Method to build an Onload.Error submessage
  errorMessage: function(error, url, line) {
    var msg = '';
    if (error) {
      msg = this.writeBinaryField(msg, 1, error);
    }
    if (url) {
      msg = this.writeBinaryField(msg, 2, url);
    }
    if (line) {
      msg = this.writeVarintField(msg, 3, line);
    }
    return msg;
  },

  // Method to build an Event message
  eventMessage: function(type, payload, metadata) {
    var msg = '';
    msg = this.writeBinaryField(msg, 1, type);
    if (payload != null) {
      msg = this.writeBinaryField(msg, 2, payload);
    }
    if (metadata != null) {
      msg = this.writeBinaryField(msg, 3, metadata);
    }
    return msg;
  },

  // Method to build the EventBundle message
  eventBundleMessage: function() {
    var msg = '';
    msg = this.writeBinaryField(msg, 1, this.getUUID());
    msg = this.writeVarintField(msg, 2, this.eventCounter++);
    // add each event message to the bundle
    for (var i = 0, len = this.eventList.length; i < len; i++) {
      msg = this.writeBinaryField(msg, 3, this.eventList[i]);
    }
    return msg;
  },

  // Method to build the Tracker message
  trackerMessage: function() {
    var msg = '';
    msg = this.writeBinaryField(msg, 1, location.href);
    msg = this.writeBinaryField(msg, 2, this.upstreamLabel);
    msg = this.writeBinaryField(msg, 3, this.upstreamHost);
    msg = this.writeBinaryField(msg, 4, this.upstreamURI);
    msg = this.writeDTimeFields(msg, 5, 6, this.pageGenTime);
    msg = this.writeDTimeFields(msg, 7, 8, this.enterHeadTime);
    if (!this.leaveBodyTime) {
      this.leaveBody();
    }
    msg = this.writeDTimeFields(msg, 9, 10, this.leaveBodyTime);
    if (screen.width) {
      msg = this.writeVarintField(msg, 11, screen.width);
    }
    if (screen.height) {
      msg = this.writeVarintField(msg, 12, screen.height);
    }
    if (screen.colorDepth) {
      msg = this.writeVarintField(msg, 13, screen.colorDepth);
    }
    if (document.referrer) {
      msg = this.writeBinaryField(msg, 14, document.referrer);
    }
    if (this.metadata) {
      msg = this.writeBinaryField(msg, 15, this.metadata);
    }
    msg = this.writeBinaryField(msg, 99, this.getUUID());

    return msg;
  },

  // Method to build the Onload message
  onloadMessage: function(time, exited) {
    var msg = '';

    msg = this.writeBinaryField(msg, 1, this.getUUID());
    msg = this.writeBinaryField(msg, 2, this.upstreamUUID);
    msg = this.writeDTimeFields(msg, 3, 4, this.pageGenTime);
    msg = this.writeDTimeFields(msg, 5, 6, this.enterHeadTime);
    if (this.leaveBodyTime) {
      msg = this.writeDTimeFields(msg, 7, 8, this.leaveBodyTime);
    }
    msg = this.writeDTimeFields(msg, 9, 10, time);
    msg = this.writeBinaryField(msg, 11, this.upstreamHost);
    msg = this.writeBinaryField(msg, 12, this.upstreamURI);
    msg = this.writeBinaryField(msg, 13,
                                this.checkPointMessage(this.pageGenTime));
    msg = this.writeBinaryField(msg, 14,
                                this.checkPointMessage(this.enterHeadTime));
    msg = this.writeBinaryField(msg, 15,
                                this.checkPointMessage(this.leaveBodyTime));
    msg = this.writeBinaryField(msg, 16,
                                this.checkPointMessage(time));
    for (var i = 0, len = this.checkPointList.length; i < len; i++) {
      msg = this.writeBinaryField(msg, 17, this.checkPointList[i]);
    }
    if (exited) {
      msg = this.writeVarintField(msg, 18, 1);
    }
    for (i = 0, len = this.errors.length; i < len; i++) {
      msg = this.writeBinaryField(msg, 19, this.errors[i]);
    }
    return msg;
  },

  // Method to tell whether the user agent could be a robot
  robot: function() {
    if (navigator && navigator.userAgent) {
      if (navigator.userAgent.match(/googlebot|gomezagent/i)) {
        return 1;
      }
    }

    return 0;
  },

  // Method to fetch a ZFC tracking pixel
  fetch: function(path, query) {
    if (!this.robot()) {
      var scr = document.getElementById('zfcPixels');
      if (scr) {
        var img = document.createElement('img');
        img.src = path + '?' + this.base64Encode(query);
        img.width = 1;
        img.height = 1;
        scr.parentNode.insertBefore(img, scr);
      }
    }
  },

  // Method to fetch the Tracker pixel
  tracker: function(path) {
    this.fetch(path, this.trackerMessage());
  },

  // Method to fetch the Onload pixel
  onload: function(path, time, exited) {
    this.fetch(path, this.onloadMessage(time, exited));
    if (this.checkPointList.length) {
      this.checkPointList = [];
    }
    if (this.errors.length) {
      this.errors = [];
    }
  },

  // Method to fetch the EventBundle pixel
  sendEvent: function(type, payload, metadata) {
    if (this.eventUrl != null) {
      if (type != null) {
        this.addEvent(type, payload, metadata);
      }
      if (this.eventList.length) {
        this.fetch(this.eventUrl, this.eventBundleMessage());
        this.eventList = [];
      }
    }
  }
}

// Convert the zfc Array into the ZFC object and exec queued calls

if (zfc) {
  var arr = zfc;
  zfc = new ZFC();
  for (var i = 0, len = arr.length; i < len; i++) {
    zfc.push(arr[i]);
  }
}
