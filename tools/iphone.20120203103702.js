



/* ============================== INIT ============================== */

var is_portrait = false;
var screenWidth;

function init() {
    // listen to screen orientation changes
    window.addEventListener('orientationchange', orientation_changed, false);
    // set up vars based on orientation
    orientation_changed();
    
    (function() {
        var e_input = document.querySelector("#global-search input[type=text]");
        if (!e_input)
            return;
        
        e_input.value = "Search Zappos";
        
        var focus = function() {
            if (this.value == "Search Zappos") {
                this.value = "";
                this.style.color = "#222";
            }
        };
        
        var blur = function() {
            if (this.value == "") {
                this.value = "Search Zappos";
                this.style.color = "#777";
            }
        };
        
        e_input.addEventListener('focus', focus, false);
        e_input.addEventListener('blur', blur, false);
    })();
    
    (function(){
      var switchButton = document.querySelectorAll("a.switchToStandard");
      var url = location.href;
      if(readCookie('noZapMobile')) {
        writeCookie('noZapMobile','true', 0);
      }
      
      switchButton[0].addEventListener('click', function(e) {
        e.preventDefault();
        writeCookie('noZapMobile','true', 365);
        window.location = url.match(/http:\/\/([^.]*)\.iphone\.zappos\.com/) ? url.replace(/\/\/([^.]+)\.([^.]+)?/, function (_, m1, m2) { return "//" + m1 + ".zeta" }) : url.replace("iphone.", "www.");
      });
    })();
    
    (function() {
        var e_sorts = document.querySelectorAll("a.sort");
        e_sorts = e_sorts.toArray();
        if (e_sorts.length < 1)
            return;
            
        var toggle = function(e) {
            e.preventDefault();
            var e_ul = this.parentNode.parentNode;
            var e_options = e_ul.querySelectorAll('.option');
            
            if (this.className.match(/closed/)) {
                this.className = this.className.replace(/closed/, "open");
                e_options.toArray().forEach(function(e_option) {
                    e_option.style.display = "block";
                });
            } else {
                this.className = this.className.replace(/open/, "closed");
                e_options.toArray().forEach(function(e_option) {
                    e_option.style.display = "none";
                });
            }
        };
        
        e_sorts.forEach(function(e_sort) {
            e_sort.addEventListener("click", toggle, false);
        });
    })();

/* =============================== COUPON CODE TOGGLE =============================== */
	(function() {
		var couponCont = document.getElementById('gc-coupon-content');
        if(!couponCont) return;
        
  		document.getElementById('coupon-expand-link').addEventListener("click", function(e) {
			e.preventDefault();
    		if (couponCont.className == 'closed') {
      			couponCont.className = 'open';
    		} else {
      			couponCont.className = 'closed';
    		}
  		}, false);
	})();

/* ============================== INPUT FIELD CLEAR ================================ */
	(function() {
	    if(!document.getElementById('code')) return;
	    
		document.getElementById('code').addEventListener("focus", function() {
			this.value = this.value.replace(' - type your code here - ','');
		}, false);
	})();
	
/* ============================== SALES TAX POPUP ================================ */
	(function() {
	    if(!document.getElementById('salesTax')) return;
	    
		document.getElementById('salesTax').addEventListener("click", function(e) {
			e.preventDefault();
			window.open('tax.zml','');
		}, false);
	})();
};

/* ============================== SCREEN ORIENTIATION ============================== */

// called when orientation changes
function orientation_changed() {
    is_portrait = (window.orientation == 0 || window.orientation == null);
    document.body.className = is_portrait ? 'portrait' : 'landscape';
    screen_width = is_portrait ? 320 : 480;
    
    // ensure the canvas is positioned at top-left
    // window.setTimeout(function() { window.scrollTo(0, 1); }, 0);
};

/* ============================== UTILS ============================== */

function hideAddressBar() {
    //alert(window.scrollY);
    if (window.scrollY != 0)
        return;
    window.scrollTo(0, 1);
    setTimeout(function () {
        window.scrollTo(0, 0);
    }, 0);
};

NodeList.prototype.toArray = function() {
    return Array.prototype.slice.call(this);
}

function writeCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/; domain=zappos.com";
}

function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}


/* ============================== INIT ============================== */

init();
window.addEventListener('load', function() { setTimeout(hideAddressBar, 500); }, false);
window.z = {};

$j = document.querySelector;