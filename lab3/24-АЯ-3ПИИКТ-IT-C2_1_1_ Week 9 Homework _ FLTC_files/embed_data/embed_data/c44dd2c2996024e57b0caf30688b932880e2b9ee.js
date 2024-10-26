var H5P = H5P || {};
/**
 * Transition contains helper function relevant for transitioning
 */
H5P.Transition = (function ($) {

  /**
   * @class
   * @namespace H5P
   */
  Transition = {};

  /**
   * @private
   */
  Transition.transitionEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'transition':       'transitionend',
    'MozTransition':    'transitionend',
    'OTransition':      'oTransitionEnd',
    'msTransition':     'MSTransitionEnd'
  };

  /**
   * @private
   */
  Transition.cache = [];

  /**
   * Get the vendor property name for an event
   *
   * @function H5P.Transition.getVendorPropertyName
   * @static
   * @private
   * @param  {string} prop Generic property name
   * @return {string}      Vendor specific property name
   */
  Transition.getVendorPropertyName = function (prop) {

    if (Transition.cache[prop] !== undefined) {
      return Transition.cache[prop];
    }

    var div = document.createElement('div');

    // Handle unprefixed versions (FF16+, for example)
    if (prop in div.style) {
      Transition.cache[prop] = prop;
    }
    else {
      var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
      var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

      if (prop in div.style) {
        Transition.cache[prop] = prop;
      }
      else {
        for (var i = 0; i < prefixes.length; ++i) {
          var vendorProp = prefixes[i] + prop_;
          if (vendorProp in div.style) {
            Transition.cache[prop] = vendorProp;
            break;
          }
        }
      }
    }

    return Transition.cache[prop];
  };

  /**
   * Get the name of the transition end event
   *
   * @static
   * @private
   * @return {string}  description
   */
  Transition.getTransitionEndEventName = function () {
    return Transition.transitionEndEventNames[Transition.getVendorPropertyName('transition')] || undefined;
  };

  /**
   * Helper function for listening on transition end events
   *
   * @function H5P.Transition.onTransitionEnd
   * @static
   * @param  {domElement} $element The element which is transitioned
   * @param  {function} callback The callback to be invoked when transition is finished
   * @param  {number} timeout  Timeout in milliseconds. Fallback if transition event is never fired
   */
  Transition.onTransitionEnd = function ($element, callback, timeout) {
    // Fallback on 1 second if transition event is not supported/triggered
    timeout = timeout || 1000;
    Transition.transitionEndEventName = Transition.transitionEndEventName || Transition.getTransitionEndEventName();
    var callbackCalled = false;

    var doCallback = function () {
      if (callbackCalled) {
        return;
      }
      $element.off(Transition.transitionEndEventName, callback);
      callbackCalled = true;
      clearTimeout(timer);
      callback();
    };

    var timer = setTimeout(function () {
      doCallback();
    }, timeout);

    $element.on(Transition.transitionEndEventName, function () {
      doCallback();
    });
  };

  /**
   * Wait for a transition - when finished, invokes next in line
   *
   * @private
   *
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   * @param {number}      index                   The index for current transition
   */
  var runSequence = function (transitions, index) {
    if (index >= transitions.length) {
      return;
    }

    var transition = transitions[index];
    H5P.Transition.onTransitionEnd(transition.$element, function () {
      if (transition.end) {
        transition.end();
      }
      if (transition.break !== true) {
        runSequence(transitions, index+1);
      }
    }, transition.timeout || undefined);
  };

  /**
   * Run a sequence of transitions
   *
   * @function H5P.Transition.sequence
   * @static
   * @param {Object[]}    transitions             Array of transitions
   * @param {H5P.jQuery}  transitions[].$element  Dom element transition is performed on
   * @param {number=}     transitions[].timeout   Timeout fallback if transition end never is triggered
   * @param {bool=}       transitions[].break     If true, sequence breaks after this transition
   */
  Transition.sequence = function (transitions) {
    runSequence(transitions, 0);
  };

  return Transition;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * Class responsible for creating a help text dialog
 */
H5P.JoubelHelpTextDialog = (function ($) {

  var numInstances = 0;
  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery}  $container  The container which message dialog will be appended to
   * @param {string}      message     The message
   * @param {string}      closeButtonTitle The title for the close button
   * @return {H5P.jQuery}
   */
  function JoubelHelpTextDialog(header, message, closeButtonTitle) {
    H5P.EventDispatcher.call(this);

    var self = this;

    numInstances++;
    var headerId = 'joubel-help-text-header-' + numInstances;
    var helpTextId = 'joubel-help-text-body-' + numInstances;

    var $helpTextDialogBox = $('<div>', {
      'class': 'joubel-help-text-dialog-box',
      'role': 'dialog',
      'aria-labelledby': headerId,
      'aria-describedby': helpTextId
    });

    $('<div>', {
      'class': 'joubel-help-text-dialog-background'
    }).appendTo($helpTextDialogBox);

    var $helpTextDialogContainer = $('<div>', {
      'class': 'joubel-help-text-dialog-container'
    }).appendTo($helpTextDialogBox);

    $('<div>', {
      'class': 'joubel-help-text-header',
      'id': headerId,
      'role': 'header',
      'html': header
    }).appendTo($helpTextDialogContainer);

    $('<div>', {
      'class': 'joubel-help-text-body',
      'id': helpTextId,
      'html': message,
      'role': 'document',
      'tabindex': 0
    }).appendTo($helpTextDialogContainer);

    var handleClose = function () {
      $helpTextDialogBox.remove();
      self.trigger('closed');
    };

    var $closeButton = $('<div>', {
      'class': 'joubel-help-text-remove',
      'role': 'button',
      'title': closeButtonTitle,
      'tabindex': 1,
      'click': handleClose,
      'keydown': function (event) {
        // 32 - space, 13 - enter
        if ([32, 13].indexOf(event.which) !== -1) {
          event.preventDefault();
          handleClose();
        }
      }
    }).appendTo($helpTextDialogContainer);

    /**
     * Get the DOM element
     * @return {HTMLElement}
     */
    self.getElement = function () {
      return $helpTextDialogBox;
    };

    self.focus = function () {
      $closeButton.focus();
    };
  }

  JoubelHelpTextDialog.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelHelpTextDialog.prototype.constructor = JoubelHelpTextDialog;

  return JoubelHelpTextDialog;
}(H5P.jQuery));
;
var H5P = H5P || {};

/**
 * Class responsible for creating auto-disappearing dialogs
 */
H5P.JoubelMessageDialog = (function ($) {

  /**
   * Display a pop-up containing a message.
   *
   * @param {H5P.jQuery} $container The container which message dialog will be appended to
   * @param {string} message The message
   * @return {H5P.jQuery}
   */
  function JoubelMessageDialog ($container, message) {
    var timeout;

    var removeDialog = function () {
      $warning.remove();
      clearTimeout(timeout);
      $container.off('click.messageDialog');
    };

    // Create warning popup:
    var $warning = $('<div/>', {
      'class': 'joubel-message-dialog',
      text: message
    }).appendTo($container);

    // Remove after 3 seconds or if user clicks anywhere in $container:
    timeout = setTimeout(removeDialog, 3000);
    $container.on('click.messageDialog', removeDialog);

    return $warning;
  }

  return JoubelMessageDialog;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * Class responsible for creating a circular progress bar
 */

H5P.JoubelProgressCircle = (function ($) {

  /**
   * Constructor for the Progress Circle
   *
   * @param {Number} number The amount of progress to display
   * @param {string} progressColor Color for the progress meter
   * @param {string} backgroundColor Color behind the progress meter
   */
  function ProgressCircle(number, progressColor, fillColor, backgroundColor) {
    progressColor = progressColor || '#1a73d9';
    fillColor = fillColor || '#f0f0f0';
    backgroundColor = backgroundColor || '#ffffff';
    var progressColorRGB = this.hexToRgb(progressColor);

    //Verify number
    try {
      number = Number(number);
      if (number === '') {
        throw 'is empty';
      }
      if (isNaN(number)) {
        throw 'is not a number';
      }
    } catch (e) {
      number = 'err';
    }

    //Draw circle
    if (number > 100) {
      number = 100;
    }

    // We can not use rgba, since they will stack on top of each other.
    // Instead we create the equivalent of the rgba color
    // and applies this to the activeborder and background color.
    var progressColorString = 'rgb(' + parseInt(progressColorRGB.r, 10) +
      ',' + parseInt(progressColorRGB.g, 10) +
      ',' + parseInt(progressColorRGB.b, 10) + ')';

    // Circle wrapper
    var $wrapper = $('<div/>', {
      'class': "joubel-progress-circle-wrapper"
    });

    //Active border indicates progress
    var $activeBorder = $('<div/>', {
      'class': "joubel-progress-circle-active-border"
    }).appendTo($wrapper);

    //Background circle
    var $backgroundCircle = $('<div/>', {
      'class': "joubel-progress-circle-circle"
    }).appendTo($activeBorder);

    //Progress text/number
    $('<span/>', {
      'text': number + '%',
      'class': "joubel-progress-circle-percentage"
    }).appendTo($backgroundCircle);

    var deg = number * 3.6;
    if (deg <= 180) {
      $activeBorder.css('background-image',
        'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, ' + fillColor + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    } else {
      $activeBorder.css('background-image',
        'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, ' + progressColorString + ' 50%),' +
        'linear-gradient(90deg, ' + fillColor + ' 50%, transparent 50%)')
        .css('border', '2px solid' + backgroundColor)
        .css('background-color', progressColorString);
    }

    this.$activeBorder = $activeBorder;
    this.$backgroundCircle = $backgroundCircle;
    this.$wrapper = $wrapper;

    this.initResizeFunctionality();

    return $wrapper;
  }

  /**
   * Initializes resize functionality for the progress circle
   */
  ProgressCircle.prototype.initResizeFunctionality = function () {
    var self = this;

    $(window).resize(function () {
      // Queue resize
      setTimeout(function () {
        self.resize();
      });
    });

    // First resize
    setTimeout(function () {
      self.resize();
    }, 0);
  };

  /**
   * Resize function makes progress circle grow or shrink relative to parent container
   */
  ProgressCircle.prototype.resize = function () {
    var $parent = this.$wrapper.parent();

    if ($parent !== undefined && $parent) {

      // Measurements
      var fontSize = parseInt($parent.css('font-size'), 10);

      // Static sizes
      var fontSizeMultiplum = 3.75;
      var progressCircleWidthPx = parseInt((fontSize / 4.5), 10) % 2 === 0 ? parseInt((fontSize / 4.5), 10) + 4 : parseInt((fontSize / 4.5), 10) + 5;
      var progressCircleOffset = progressCircleWidthPx / 2;

      var width = fontSize * fontSizeMultiplum;
      var height = fontSize * fontSizeMultiplum;
      this.$activeBorder.css({
        'width': width,
        'height': height
      });

      this.$backgroundCircle.css({
        'width': width - progressCircleWidthPx,
        'height': height - progressCircleWidthPx,
        'top': progressCircleOffset,
        'left': progressCircleOffset
      });
    }
  };

  /**
   * Hex to RGB conversion
   * @param hex
   * @returns {{r: Number, g: Number, b: Number}}
   */
  ProgressCircle.prototype.hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return ProgressCircle;

}(H5P.jQuery));
;
var H5P = H5P || {};

H5P.SimpleRoundedButton = (function ($) {

  /**
   * Creates a new tip
   */
  function SimpleRoundedButton(text) {

    var $simpleRoundedButton = $('<div>', {
      'class': 'joubel-simple-rounded-button',
      'title': text,
      'role': 'button',
      'tabindex': '0'
    }).keydown(function (e) {
      // 32 - space, 13 - enter
      if ([32, 13].indexOf(e.which) !== -1) {
        $(this).click();
        e.preventDefault();
      }
    });

    $('<span>', {
      'class': 'joubel-simple-rounded-button-text',
      'html': text
    }).appendTo($simpleRoundedButton);

    return $simpleRoundedButton;
  }

  return SimpleRoundedButton;
}(H5P.jQuery));
;
var H5P = H5P || {};

/**
 * Class responsible for creating speech bubbles
 */
H5P.JoubelSpeechBubble = (function ($) {

  var $currentSpeechBubble;
  var $currentContainer;  
  var $tail;
  var $innerTail;
  var removeSpeechBubbleTimeout;
  var currentMaxWidth;

  var DEFAULT_MAX_WIDTH = 400;

  var iDevice = navigator.userAgent.match(/iPod|iPhone|iPad/g) ? true : false;

  /**
   * Creates a new speech bubble
   *
   * @param {H5P.jQuery} $container The speaking object
   * @param {string} text The text to display
   * @param {number} maxWidth The maximum width of the bubble
   * @return {H5P.JoubelSpeechBubble}
   */
  function JoubelSpeechBubble($container, text, maxWidth) {
    maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    currentMaxWidth = maxWidth;
    $currentContainer = $container;

    this.isCurrent = function ($tip) {
      return $tip.is($currentContainer);
    };

    this.remove = function () {
      remove();
    };

    var fadeOutSpeechBubble = function ($speechBubble) {
      if (!$speechBubble) {
        return;
      }

      // Stop removing bubble
      clearTimeout(removeSpeechBubbleTimeout);

      $speechBubble.removeClass('show');
      setTimeout(function () {
        if ($speechBubble) {
          $speechBubble.remove();
          $speechBubble = undefined;
        }
      }, 500);
    };

    if ($currentSpeechBubble !== undefined) {
      remove();
    }

    var $h5pContainer = getH5PContainer($container);

    // Make sure we fade out old speech bubble
    fadeOutSpeechBubble($currentSpeechBubble);

    // Create bubble
    $tail = $('<div class="joubel-speech-bubble-tail"></div>');
    $innerTail = $('<div class="joubel-speech-bubble-inner-tail"></div>');
    var $innerBubble = $(
      '<div class="joubel-speech-bubble-inner">' +
      '<div class="joubel-speech-bubble-text">' + text + '</div>' +
      '</div>'
    ).prepend($innerTail);

    $currentSpeechBubble = $(
      '<div class="joubel-speech-bubble" aria-live="assertive">'
    ).append([$tail, $innerBubble])
      .appendTo($h5pContainer);

    // Show speech bubble with transition
    setTimeout(function () {
      $currentSpeechBubble.addClass('show');
    }, 0);

    position($currentSpeechBubble, $currentContainer, maxWidth, $tail, $innerTail);

    // Handle click to close
    H5P.$body.on('mousedown.speechBubble', handleOutsideClick);

    // Handle window resizing
    H5P.$window.on('resize', '', handleResize);

    // Handle clicks when inside IV which blocks bubbling.
    $container.parents('.h5p-dialog')
      .on('mousedown.speechBubble', handleOutsideClick);

    if (iDevice) {
      H5P.$body.css('cursor', 'pointer');
    }

    return this;
  }

  // Remove speechbubble if it belongs to a dom element that is about to be hidden
  H5P.externalDispatcher.on('domHidden', function (event) {
    if ($currentSpeechBubble !== undefined && event.data.$dom.find($currentContainer).length !== 0) {
      remove();
    }
  });

  /**
   * Returns the closest h5p container for the given DOM element.
   * 
   * @param {object} $container jquery element
   * @return {object} the h5p container (jquery element)
   */
  function getH5PContainer($container) {
    var $h5pContainer = $container.closest('.h5p-frame');

    // Check closest h5p frame first, then check for container in case there is no frame.
    if (!$h5pContainer.length) {
      $h5pContainer = $container.closest('.h5p-container');
    }

    return $h5pContainer;
  }

  /**
   * Event handler that is called when the window is resized.
   */
  function handleResize() {
    position($currentSpeechBubble, $currentContainer, currentMaxWidth, $tail, $innerTail);
  }

  /**
   * Repositions the speech bubble according to the position of the container.
   * 
   * @param {object} $currentSpeechbubble the speech bubble that should be positioned   
   * @param {object} $container the container to which the speech bubble should point 
   * @param {number} maxWidth the maximum width of the speech bubble
   * @param {object} $tail the tail (the triangle that points to the referenced container)
   * @param {object} $innerTail the inner tail (the triangle that points to the referenced container)
   */
  function position($currentSpeechBubble, $container, maxWidth, $tail, $innerTail) {
    var $h5pContainer = getH5PContainer($container);

    // Calculate offset between the button and the h5p frame
    var offset = getOffsetBetween($h5pContainer, $container);

    var direction = (offset.bottom > offset.top ? 'bottom' : 'top');
    var tipWidth = offset.outerWidth * 0.9; // Var needs to be renamed to make sense
    var bubbleWidth = tipWidth > maxWidth ? maxWidth : tipWidth;

    var bubblePosition = getBubblePosition(bubbleWidth, offset);
    var tailPosition = getTailPosition(bubbleWidth, bubblePosition, offset, $container.width());
    // Need to set font-size, since element is appended to body.
    // Using same font-size as parent. In that way it will grow accordingly
    // when resizing
    var fontSize = 16;//parseFloat($parent.css('font-size'));

    // Set width and position of speech bubble
    $currentSpeechBubble.css(bubbleCSS(
      direction,
      bubbleWidth,
      bubblePosition,
      fontSize
    ));

    var preparedTailCSS = tailCSS(direction, tailPosition);
    $tail.css(preparedTailCSS);
    $innerTail.css(preparedTailCSS);
  }

  /**
   * Static function for removing the speechbubble
   */
  var remove = function () {
    H5P.$body.off('mousedown.speechBubble');
    H5P.$window.off('resize', '', handleResize);
    $currentContainer.parents('.h5p-dialog').off('mousedown.speechBubble');
    if (iDevice) {
      H5P.$body.css('cursor', '');
    }
    if ($currentSpeechBubble !== undefined) {
      // Apply transition, then remove speech bubble
      $currentSpeechBubble.removeClass('show');

      // Make sure we remove any old timeout before reassignment
      clearTimeout(removeSpeechBubbleTimeout);
      removeSpeechBubbleTimeout = setTimeout(function () {
        $currentSpeechBubble.remove();
        $currentSpeechBubble = undefined;
      }, 500);
    }
    // Don't return false here. If the user e.g. clicks a button when the bubble is visible,
    // we want the bubble to disapear AND the button to receive the event
  };

  /**
   * Remove the speech bubble and container reference
   */
  function handleOutsideClick(event) {
    if (event.target === $currentContainer[0]) {
      return; // Button clicks are not outside clicks
    }

    remove();
    // There is no current container when a container isn't clicked
    $currentContainer = undefined;
  }

  /**
   * Calculate position for speech bubble
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} offset
   * @return {object} Return position for the speech bubble
   */
  function getBubblePosition(bubbleWidth, offset) {
    var bubblePosition = {};

    var tailOffset = 9;
    var widthOffset = bubbleWidth / 2;

    // Calculate top position
    bubblePosition.top = offset.top + offset.innerHeight;

    // Calculate bottom position
    bubblePosition.bottom = offset.bottom + offset.innerHeight + tailOffset;

    // Calculate left position
    if (offset.left < widthOffset) {
      bubblePosition.left = 3;
    }
    else if ((offset.left + widthOffset) > offset.outerWidth) {
      bubblePosition.left = offset.outerWidth - bubbleWidth - 3;
    }
    else {
      bubblePosition.left = offset.left - widthOffset + (offset.innerWidth / 2);
    }

    return bubblePosition;
  }

  /**
   * Calculate position for speech bubble tail
   *
   * @param {number} bubbleWidth The width of the speech bubble
   * @param {object} bubblePosition Speech bubble position
   * @param {object} offset
   * @param {number} iconWidth The width of the tip icon
   * @return {object} Return position for the tail
   */
  function getTailPosition(bubbleWidth, bubblePosition, offset, iconWidth) {
    var tailPosition = {};
    // Magic numbers. Tuned by hand so that the tail fits visually within
    // the bounds of the speech bubble.
    var leftBoundary = 9;
    var rightBoundary = bubbleWidth - 20;

    tailPosition.left = offset.left - bubblePosition.left + (iconWidth / 2) - 6;
    if (tailPosition.left < leftBoundary) {
      tailPosition.left = leftBoundary;
    }
    if (tailPosition.left > rightBoundary) {
      tailPosition.left = rightBoundary;
    }

    tailPosition.top = -6;
    tailPosition.bottom = -6;

    return tailPosition;
  }

  /**
   * Return bubble CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {number} width The width of the speech bubble
   * @param {object} position Speech bubble position
   * @param {number} fontSize The size of the bubbles font
   * @return {object} Return CSS
   */
  function bubbleCSS(direction, width, position, fontSize) {
    if (direction === 'top') {
      return {
        width: width + 'px',
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        top: ''
      };
    }
    else {
      return {
        width: width + 'px',
        top: position.top + 'px',
        left: position.left + 'px',
        fontSize: fontSize + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Return tail CSS for the desired growth direction
   *
   * @param {string} direction The direction the speech bubble will grow
   * @param {object} position Tail position
   * @return {object} Return CSS
   */
  function tailCSS(direction, position) {
    if (direction === 'top') {
      return {
        bottom: position.bottom + 'px',
        left: position.left + 'px',
        top: ''
      };
    }
    else {
      return {
        top: position.top + 'px',
        left: position.left + 'px',
        bottom: ''
      };
    }
  }

  /**
   * Calculates the offset between an element inside a container and the
   * container. Only works if all the edges of the inner element are inside the
   * outer element.
   * Width/height of the elements is included as a convenience.
   *
   * @param {H5P.jQuery} $outer
   * @param {H5P.jQuery} $inner
   * @return {object} Position offset
   */
  function getOffsetBetween($outer, $inner) {
    var outer = $outer[0].getBoundingClientRect();
    var inner = $inner[0].getBoundingClientRect();

    return {
      top: inner.top - outer.top,
      right: outer.right - inner.right,
      bottom: outer.bottom - inner.bottom,
      left: inner.left - outer.left,
      innerWidth: inner.width,
      innerHeight: inner.height,
      outerWidth: outer.width,
      outerHeight: outer.height
    };
  }

  return JoubelSpeechBubble;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelThrobber = (function ($) {

  /**
   * Creates a new tip
   */
  function JoubelThrobber() {

    // h5p-throbber css is described in core
    var $throbber = $('<div/>', {
      'class': 'h5p-throbber'
    });

    return $throbber;
  }

  return JoubelThrobber;
}(H5P.jQuery));
;
H5P.JoubelTip = (function ($) {
  var $conv = $('<div/>');

  /**
   * Creates a new tip element.
   *
   * NOTE that this may look like a class but it doesn't behave like one.
   * It returns a jQuery object.
   *
   * @param {string} tipHtml The text to display in the popup
   * @param {Object} [behaviour] Options
   * @param {string} [behaviour.tipLabel] Set to use a custom label for the tip button (you want this for good A11Y)
   * @param {boolean} [behaviour.helpIcon] Set to 'true' to Add help-icon classname to Tip button (changes the icon)
   * @param {boolean} [behaviour.showSpeechBubble] Set to 'false' to disable functionality (you may this in the editor)
   * @param {boolean} [behaviour.tabcontrol] Set to 'true' if you plan on controlling the tabindex in the parent (tabindex="-1")
   * @return {H5P.jQuery|undefined} Tip button jQuery element or 'undefined' if invalid tip
   */
  function JoubelTip(tipHtml, behaviour) {

    // Keep track of the popup that appears when you click the Tip button
    var speechBubble;

    // Parse tip html to determine text
    var tipText = $conv.html(tipHtml).text().trim();
    if (tipText === '') {
      return; // The tip has no textual content, i.e. it's invalid.
    }

    // Set default behaviour
    behaviour = $.extend({
      tipLabel: tipText,
      helpIcon: false,
      showSpeechBubble: true,
      tabcontrol: false
    }, behaviour);

    // Create Tip button
    var $tipButton = $('<div/>', {
      class: 'joubel-tip-container' + (behaviour.showSpeechBubble ? '' : ' be-quiet'),
      'aria-label': behaviour.tipLabel,
      'aria-expanded': false,
      role: 'button',
      tabindex: (behaviour.tabcontrol ? -1 : 0),
      click: function (event) {
        // Toggle show/hide popup
        toggleSpeechBubble();
        event.preventDefault();
      },
      keydown: function (event) {
        if (event.which === 32 || event.which === 13) { // Space & enter key
          // Toggle show/hide popup
          toggleSpeechBubble();
          event.stopPropagation();
          event.preventDefault();
        }
        else { // Any other key
          // Toggle hide popup
          toggleSpeechBubble(false);
        }
      },
      // Add markup to render icon
      html: '<span class="joubel-icon-tip-normal ' + (behaviour.helpIcon ? ' help-icon': '') + '">' +
              '<span class="h5p-icon-shadow"></span>' +
              '<span class="h5p-icon-speech-bubble"></span>' +
              '<span class="h5p-icon-info"></span>' +
            '</span>'
      // IMPORTANT: All of the markup elements must have 'pointer-events: none;'
    });

    const $tipAnnouncer = $('<div>', {
      'class': 'hidden-but-read',
      'aria-live': 'polite',
      appendTo: $tipButton,
    });

    /**
     * Tip button interaction handler.
     * Toggle show or hide the speech bubble popup when interacting with the
     * Tip button.
     *
     * @private
     * @param {boolean} [force] 'true' shows and 'false' hides.
     */
    var toggleSpeechBubble = function (force) {
      if (speechBubble !== undefined && speechBubble.isCurrent($tipButton)) {
        // Hide current popup
        speechBubble.remove();
        speechBubble = undefined;

        $tipButton.attr('aria-expanded', false);
        $tipAnnouncer.html('');
      }
      else if (force !== false && behaviour.showSpeechBubble) {
        // Create and show new popup
        speechBubble = H5P.JoubelSpeechBubble($tipButton, tipHtml);
        $tipButton.attr('aria-expanded', true);
        $tipAnnouncer.html(tipHtml);
      }
    };

    return $tipButton;
  }

  return JoubelTip;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelSlider = (function ($) {

  /**
   * Creates a new Slider
   *
   * @param {object} [params] Additional parameters
   */
  function JoubelSlider(params) {
    H5P.EventDispatcher.call(this);

    this.$slider = $('<div>', $.extend({
      'class': 'h5p-joubel-ui-slider'
    }, params));

    this.$slides = [];
    this.currentIndex = 0;
    this.numSlides = 0;
  }
  JoubelSlider.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelSlider.prototype.constructor = JoubelSlider;

  JoubelSlider.prototype.addSlide = function ($content) {
    $content.addClass('h5p-joubel-ui-slide').css({
      'left': (this.numSlides*100) + '%'
    });
    this.$slider.append($content);
    this.$slides.push($content);

    this.numSlides++;

    if(this.numSlides === 1) {
      $content.addClass('current');
    }
  };

  JoubelSlider.prototype.attach = function ($container) {
    $container.append(this.$slider);
  };

  JoubelSlider.prototype.move = function (index) {
    var self = this;

    if(index === 0) {
      self.trigger('first-slide');
    }
    if(index+1 === self.numSlides) {
      self.trigger('last-slide');
    }
    self.trigger('move');

    var $previousSlide = self.$slides[this.currentIndex];
    H5P.Transition.onTransitionEnd(this.$slider, function () {
      $previousSlide.removeClass('current');
      self.trigger('moved');
    });
    this.$slides[index].addClass('current');

    var translateX = 'translateX(' + (-index*100) + '%)';
    this.$slider.css({
      '-webkit-transform': translateX,
      '-moz-transform': translateX,
      '-ms-transform': translateX,
      'transform': translateX
    });

    this.currentIndex = index;
  };

  JoubelSlider.prototype.remove = function () {
    this.$slider.remove();
  };

  JoubelSlider.prototype.next = function () {
    if(this.currentIndex+1 >= this.numSlides) {
      return;
    }

    this.move(this.currentIndex+1);
  };

  JoubelSlider.prototype.previous = function () {
    this.move(this.currentIndex-1);
  };

  JoubelSlider.prototype.first = function () {
    this.move(0);
  };

  JoubelSlider.prototype.last = function () {
    this.move(this.numSlides-1);
  };

  return JoubelSlider;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * @module
 */
H5P.JoubelScoreBar = (function ($) {

  /* Need to use an id for the star SVG since that is the only way to reference
     SVG filters  */
  var idCounter = 0;

  /**
   * Creates a score bar
   * @class H5P.JoubelScoreBar
   * @param {number} maxScore  Maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @param {string} [helpText] Score explanation
   * @param {string} [scoreExplanationButtonLabel] Label for score explanation button
   */
  function JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel) {
    var self = this;

    self.maxScore = maxScore;
    self.score = 0;
    idCounter++;

    /**
     * @const {string}
     */
    self.STAR_MARKUP = '<svg tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63.77 53.87" aria-hidden="true" focusable="false">' +
        '<title>star</title>' +
        '<filter tabindex="-1" id="h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + '" x0="-50%" y0="-50%" width="200%" height="200%">' +
          '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"></feGaussianBlur>' +
          '<feOffset dy="2" dx="4"></feOffset>' +
          '<feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="SourceGraphic" operator="over" result="firstfilter"></feComposite>' +
          '<feGaussianBlur in="firstfilter" stdDeviation="3" result="blur2"></feGaussianBlur>' +
          '<feOffset dy="-2" dx="-4"></feOffset>' +
          '<feComposite in2="firstfilter" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"></feComposite>' +
          '<feFlood flood-color="#ffe95c" flood-opacity="1"></feFlood>' +
          '<feComposite in2="shadowDiff" operator="in"></feComposite>' +
          '<feComposite in2="firstfilter" operator="over"></feComposite>' +
        '</filter>' +
        '<path tabindex="-1" class="h5p-joubelui-score-bar-star-shadow" d="M35.08,43.41V9.16H20.91v0L9.51,10.85,9,10.93C2.8,12.18,0,17,0,21.25a11.22,11.22,0,0,0,3,7.48l8.73,8.53-1.07,6.16Z"/>' +
        '<g tabindex="-1">' +
          '<path tabindex="-1" class="h5p-joubelui-score-bar-star-border" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path tabindex="-1" class="h5p-joubelui-score-bar-star-fill" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
          '<path tabindex="-1" filter="url(#h5p-joubelui-score-bar-star-inner-shadow-' + idCounter + ')" class="h5p-joubelui-score-bar-star-fill-full-score" d="M61.36,22.8,49.72,34.11l2.78,16a2.6,2.6,0,0,1,.05.64c0,.85-.37,1.6-1.33,1.6A2.74,2.74,0,0,1,49.94,52L35.58,44.41,21.22,52a2.93,2.93,0,0,1-1.28.37c-.91,0-1.33-.75-1.33-1.6,0-.21.05-.43.05-.64l2.78-16L9.8,22.8A2.57,2.57,0,0,1,9,21.25c0-1,1-1.33,1.81-1.49l16.07-2.35L34.09,2.83c.27-.59.85-1.33,1.55-1.33s1.28.69,1.55,1.33l7.21,14.57,16.07,2.35c.75.11,1.81.53,1.81,1.49A3.07,3.07,0,0,1,61.36,22.8Z"/>' +
        '</g>' +
      '</svg>';

    /**
     * @function appendTo
     * @memberOf H5P.JoubelScoreBar#
     * @param {H5P.jQuery}  $wrapper  Dom container
     */
    self.appendTo = function ($wrapper) {
      self.$scoreBar.appendTo($wrapper);
    };

    /**
     * Create the text representation of the scorebar .
     *
     * @private
     * @return {string}
     */
    var createLabel = function (score) {
      if (!label) {
        return '';
      }

      return label.replace(':num', score).replace(':total', self.maxScore);
    };

    /**
     * Creates the html for this widget
     *
     * @method createHtml
     * @private
     */
    var createHtml = function () {
      // Container div
      self.$scoreBar = $('<div>', {
        'class': 'h5p-joubelui-score-bar',
      });

      var $visuals = $('<div>', {
        'class': 'h5p-joubelui-score-bar-visuals',
        appendTo: self.$scoreBar
      });

      // The progress bar wrapper
      self.$progressWrapper = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress-wrapper',
        appendTo: $visuals
      });

      self.$progress = $('<div>', {
        'class': 'h5p-joubelui-score-bar-progress',
        'html': createLabel(self.score),
        appendTo: self.$progressWrapper
      });

      // The star
      $('<div>', {
        'class': 'h5p-joubelui-score-bar-star',
        html: self.STAR_MARKUP
      }).appendTo($visuals);

      // The score container
      var $numerics = $('<div>', {
        'class': 'h5p-joubelui-score-numeric',
        appendTo: self.$scoreBar,
        'aria-hidden': true
      });

      // The current score
      self.$scoreCounter = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-number-counter',
        text: 0,
        appendTo: $numerics
      });

      // The separator
      $('<span>', {
        'class': 'h5p-joubelui-score-number-separator',
        text: '/',
        appendTo: $numerics
      });

      // Max score
      self.$maxScore = $('<span>', {
        'class': 'h5p-joubelui-score-number h5p-joubelui-score-max',
        text: self.maxScore,
        appendTo: $numerics
      });

      if (helpText) {
        H5P.JoubelUI.createTip(helpText, {
          tipLabel: scoreExplanationButtonLabel ? scoreExplanationButtonLabel : helpText,
          helpIcon: true
        }).appendTo(self.$scoreBar);
        self.$scoreBar.addClass('h5p-score-bar-has-help');
      }
    };

    /**
     * Set the current score
     * @method setScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number} score
     */
    self.setScore = function (score) {
      // Do nothing if score hasn't changed
      if (score === self.score) {
        return;
      }
      self.score = score > self.maxScore ? self.maxScore : score;
      self.updateVisuals();
    };

    /**
     * Increment score
     * @method incrementScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number=}        incrementBy Optional parameter, defaults to 1
     */
    self.incrementScore = function (incrementBy) {
      self.setScore(self.score + (incrementBy || 1));
    };

    /**
     * Set the max score
     * @method setMaxScore
     * @memberOf H5P.JoubelScoreBar#
     * @param  {number}    maxScore The max score
     */
    self.setMaxScore = function (maxScore) {
      self.maxScore = maxScore;
    };

    /**
     * Updates the progressbar visuals
     * @memberOf H5P.JoubelScoreBar#
     * @method updateVisuals
     */
    self.updateVisuals = function () {
      self.$progress.html(createLabel(self.score));
      self.$scoreCounter.text(self.score);
      self.$maxScore.text(self.maxScore);

      setTimeout(function () {
        // Start the progressbar animation
        self.$progress.css({
          width: ((self.score / self.maxScore) * 100) + '%'
        });

        H5P.Transition.onTransitionEnd(self.$progress, function () {
          // If fullscore fill the star and start the animation
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-full-score', self.score === self.maxScore);
          self.$scoreBar.toggleClass('h5p-joubelui-score-bar-animation-active', self.score === self.maxScore);

          // Only allow the star animation to run once
          self.$scoreBar.one("animationend", function() {
            self.$scoreBar.removeClass("h5p-joubelui-score-bar-animation-active");
          });
        }, 600);
      }, 300);
    };

    /**
     * Removes all classes
     * @method reset
     */
    self.reset = function () {
      self.$scoreBar.removeClass('h5p-joubelui-score-bar-full-score');
    };

    createHtml();
  }

  return JoubelScoreBar;
})(H5P.jQuery);
;
var H5P = H5P || {};

H5P.JoubelProgressbar = (function ($) {

  /**
   * Joubel progressbar class
   * @method JoubelProgressbar
   * @constructor
   * @param  {number}          steps Number of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   */
  function JoubelProgressbar(steps, options) {
    H5P.EventDispatcher.call(this);
    var self = this;
    this.options = $.extend({
      progressText: 'Slide :num of :total'
    }, options);
    this.currentStep = 0;
    this.steps = steps;

    this.$progressbar = $('<div>', {
      'class': 'h5p-joubelui-progressbar'
    });
    this.$background = $('<div>', {
      'class': 'h5p-joubelui-progressbar-background'
    }).appendTo(this.$progressbar);
  }

  JoubelProgressbar.prototype = Object.create(H5P.EventDispatcher.prototype);
  JoubelProgressbar.prototype.constructor = JoubelProgressbar;

  JoubelProgressbar.prototype.updateAria = function () {
    var self = this;
    if (this.options.disableAria) {
      return;
    }

    if (!this.$currentStatus) {
      this.$currentStatus = $('<div>', {
        'class': 'h5p-joubelui-progressbar-slide-status-text',
        'aria-live': 'assertive'
      }).appendTo(this.$progressbar);
    }
    var interpolatedProgressText = self.options.progressText
      .replace(':num', self.currentStep)
      .replace(':total', self.steps);
    this.$currentStatus.html(interpolatedProgressText);
  };

  /**
   * Appends to a container
   * @method appendTo
   * @param  {H5P.jquery} $container
   */
  JoubelProgressbar.prototype.appendTo = function ($container) {
    this.$progressbar.appendTo($container);
  };

  /**
   * Update progress
   * @method setProgress
   * @param  {number}    step
   */
  JoubelProgressbar.prototype.setProgress = function (step) {
    // Check for valid value:
    if (step > this.steps || step < 0) {
      return;
    }
    this.currentStep = step;
    this.$background.css({
      width: ((this.currentStep/this.steps)*100) + '%'
    });

    this.updateAria();
  };

  /**
   * Increment progress with 1
   * @method next
   */
  JoubelProgressbar.prototype.next = function () {
    this.setProgress(this.currentStep+1);
  };

  /**
   * Reset progressbar
   * @method reset
   */
  JoubelProgressbar.prototype.reset = function () {
    this.setProgress(0);
  };

  /**
   * Check if last step is reached
   * @method isLastStep
   * @return {Boolean}
   */
  JoubelProgressbar.prototype.isLastStep = function () {
    return this.steps === this.currentStep;
  };

  return JoubelProgressbar;
})(H5P.jQuery);
;
var H5P = H5P || {};

/**
 * H5P Joubel UI library.
 *
 * This is a utility library, which does not implement attach. I.e, it has to bee actively used by
 * other libraries
 * @module
 */
H5P.JoubelUI = (function ($) {

  /**
   * The internal object to return
   * @class H5P.JoubelUI
   * @static
   */
  function JoubelUI() {}

  /* Public static functions */

  /**
   * Create a tip icon
   * @method H5P.JoubelUI.createTip
   * @param  {string}  text   The textual tip
   * @param  {Object}  params Parameters
   * @return {H5P.JoubelTip}
   */
  JoubelUI.createTip = function (text, params) {
    return new H5P.JoubelTip(text, params);
  };

  /**
   * Create message dialog
   * @method H5P.JoubelUI.createMessageDialog
   * @param  {H5P.jQuery}               $container The dom container
   * @param  {string}                   message    The message
   * @return {H5P.JoubelMessageDialog}
   */
  JoubelUI.createMessageDialog = function ($container, message) {
    return new H5P.JoubelMessageDialog($container, message);
  };

  /**
   * Create help text dialog
   * @method H5P.JoubelUI.createHelpTextDialog
   * @param  {string}             header  The textual header
   * @param  {string}             message The textual message
   * @param  {string}             closeButtonTitle The title for the close button
   * @return {H5P.JoubelHelpTextDialog}
   */
  JoubelUI.createHelpTextDialog = function (header, message, closeButtonTitle) {
    return new H5P.JoubelHelpTextDialog(header, message, closeButtonTitle);
  };

  /**
   * Create progress circle
   * @method H5P.JoubelUI.createProgressCircle
   * @param  {number}             number          The progress (0 to 100)
   * @param  {string}             progressColor   The progress color in hex value
   * @param  {string}             fillColor       The fill color in hex value
   * @param  {string}             backgroundColor The background color in hex value
   * @return {H5P.JoubelProgressCircle}
   */
  JoubelUI.createProgressCircle = function (number, progressColor, fillColor, backgroundColor) {
    return new H5P.JoubelProgressCircle(number, progressColor, fillColor, backgroundColor);
  };

  /**
   * Create throbber for loading
   * @method H5P.JoubelUI.createThrobber
   * @return {H5P.JoubelThrobber}
   */
  JoubelUI.createThrobber = function () {
    return new H5P.JoubelThrobber();
  };

  /**
   * Create simple rounded button
   * @method H5P.JoubelUI.createSimpleRoundedButton
   * @param  {string}                  text The button label
   * @return {H5P.SimpleRoundedButton}
   */
  JoubelUI.createSimpleRoundedButton = function (text) {
    return new H5P.SimpleRoundedButton(text);
  };

  /**
   * Create Slider
   * @method H5P.JoubelUI.createSlider
   * @param  {Object} [params] Parameters
   * @return {H5P.JoubelSlider}
   */
  JoubelUI.createSlider = function (params) {
    return new H5P.JoubelSlider(params);
  };

  /**
   * Create Score Bar
   * @method H5P.JoubelUI.createScoreBar
   * @param  {number=}       maxScore The maximum score
   * @param {string} [label] Makes it easier for readspeakers to identify the scorebar
   * @return {H5P.JoubelScoreBar}
   */
  JoubelUI.createScoreBar = function (maxScore, label, helpText, scoreExplanationButtonLabel) {
    return new H5P.JoubelScoreBar(maxScore, label, helpText, scoreExplanationButtonLabel);
  };

  /**
   * Create Progressbar
   * @method H5P.JoubelUI.createProgressbar
   * @param  {number=}       numSteps The total numer of steps
   * @param {Object} [options] Additional options
   * @param {boolean} [options.disableAria] Disable readspeaker assistance
   * @param {string} [options.progressText] A progress text for describing
   *  current progress out of total progress for readspeakers.
   *  e.g. "Slide :num of :total"
   * @return {H5P.JoubelProgressbar}
   */
  JoubelUI.createProgressbar = function (numSteps, options) {
    return new H5P.JoubelProgressbar(numSteps, options);
  };

  /**
   * Create standard Joubel button
   *
   * @method H5P.JoubelUI.createButton
   * @param {object} params
   *  May hold any properties allowed by jQuery. If href is set, an A tag
   *  is used, if not a button tag is used.
   * @return {H5P.jQuery} The jquery element created
   */
  JoubelUI.createButton = function(params) {
    var type = 'button';
    if (params.href) {
      type = 'a';
    }
    else {
      params.type = 'button';
    }
    if (params.class) {
      params.class += ' h5p-joubelui-button';
    }
    else {
      params.class = 'h5p-joubelui-button';
    }
    return $('<' + type + '/>', params);
  };

  /**
   * Fix for iframe scoll bug in IOS. When focusing an element that doesn't have
   * focus support by default the iframe will scroll the parent frame so that
   * the focused element is out of view. This varies dependening on the elements
   * of the parent frame.
   */
  if (H5P.isFramed && !H5P.hasiOSiframeScrollFix &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    H5P.hasiOSiframeScrollFix = true;

    // Keep track of original focus function
    var focus = HTMLElement.prototype.focus;

    // Override the original focus
    HTMLElement.prototype.focus = function () {
      // Only focus the element if it supports it natively
      if ( (this instanceof HTMLAnchorElement ||
            this instanceof HTMLInputElement ||
            this instanceof HTMLSelectElement ||
            this instanceof HTMLTextAreaElement ||
            this instanceof HTMLButtonElement ||
            this instanceof HTMLIFrameElement ||
            this instanceof HTMLAreaElement) && // HTMLAreaElement isn't supported by Safari yet.
          !this.getAttribute('role')) { // Focus breaks if a different role has been set
          // In theory this.isContentEditable should be able to recieve focus,
          // but it didn't work when tested.

        // Trigger the original focus with the proper context
        focus.call(this);
      }
    };
  }

  return JoubelUI;
})(H5P.jQuery);
;
var oldJQuery = jQuery;
var jQuery = H5P.jQuery;

/*! jQuery UI - v1.13.0 - 2021-10-07
* http://jqueryui.com
* Includes: widget.js, position.js, data.js, disable-selection.js, effect.js, effects/effect-blind.js, effects/effect-bounce.js, effects/effect-clip.js, effects/effect-drop.js, effects/effect-explode.js, effects/effect-fade.js, effects/effect-fold.js, effects/effect-highlight.js, effects/effect-puff.js, effects/effect-pulsate.js, effects/effect-scale.js, effects/effect-shake.js, effects/effect-size.js, effects/effect-slide.js, effects/effect-transfer.js, focusable.js, form-reset-mixin.js, jquery-patch.js, keycode.js, labels.js, scroll-parent.js, tabbable.js, unique-id.js, widgets/accordion.js, widgets/autocomplete.js, widgets/button.js, widgets/checkboxradio.js, widgets/controlgroup.js, widgets/datepicker.js, widgets/dialog.js, widgets/draggable.js, widgets/droppable.js, widgets/menu.js, widgets/mouse.js, widgets/progressbar.js, widgets/resizable.js, widgets/selectable.js, widgets/selectmenu.js, widgets/slider.js, widgets/sortable.js, widgets/spinner.js, widgets/tabs.js, widgets/tooltip.js
* Copyright jQuery Foundation and other contributors; Licensed MIT */

( function( factory ) {
	"use strict";

	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {
	"use strict";

	$.ui = $.ui || {};

	var version = $.ui.version = "1.13.0";


	/*!
 * jQuery UI Widget 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget
//>>group: Core
//>>description: Provides a factory for creating stateful widgets with a common API.
//>>docs: http://api.jqueryui.com/jQuery.widget/
//>>demos: http://jqueryui.com/widget/


	var widgetUuid = 0;
	var widgetHasOwnProperty = Array.prototype.hasOwnProperty;
	var widgetSlice = Array.prototype.slice;

	$.cleanData = ( function( orig ) {
		return function( elems ) {
			var events, elem, i;
			for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}
			}
			orig( elems );
		};
	} )( $.cleanData );

	$.widget = function( name, base, prototype ) {
		var existingConstructor, constructor, basePrototype;

		// ProxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		var proxiedPrototype = {};

		var namespace = name.split( "." )[ 0 ];
		name = name.split( "." )[ 1 ];
		var fullName = namespace + "-" + name;

		if ( !prototype ) {
			prototype = base;
			base = $.Widget;
		}

		if ( Array.isArray( prototype ) ) {
			prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
		}

		// Create selector for plugin
		$.expr.pseudos[ fullName.toLowerCase() ] = function( elem ) {
			return !!$.data( elem, fullName );
		};

		$[ namespace ] = $[ namespace ] || {};
		existingConstructor = $[ namespace ][ name ];
		constructor = $[ namespace ][ name ] = function( options, element ) {

			// Allow instantiation without "new" keyword
			if ( !this._createWidget ) {
				return new constructor( options, element );
			}

			// Allow instantiation without initializing for simple inheritance
			// must use "new" keyword (the code above always passes args)
			if ( arguments.length ) {
				this._createWidget( options, element );
			}
		};

		// Extend with the existing constructor to carry over any static properties
		$.extend( constructor, existingConstructor, {
			version: prototype.version,

			// Copy the object used to create the prototype in case we need to
			// redefine the widget later
			_proto: $.extend( {}, prototype ),

			// Track widgets that inherit from this widget in case this widget is
			// redefined after a widget inherits from it
			_childConstructors: []
		} );

		basePrototype = new base();

		// We need to make the options hash a property directly on the new instance
		// otherwise we'll modify the options hash on the prototype that we're
		// inheriting from
		basePrototype.options = $.widget.extend( {}, basePrototype.options );
		$.each( prototype, function( prop, value ) {
			if ( typeof value !== "function" ) {
				proxiedPrototype[ prop ] = value;
				return;
			}
			proxiedPrototype[ prop ] = ( function() {
				function _super() {
					return base.prototype[ prop ].apply( this, arguments );
				}

				function _superApply( args ) {
					return base.prototype[ prop ].apply( this, args );
				}

				return function() {
					var __super = this._super;
					var __superApply = this._superApply;
					var returnValue;

					this._super = _super;
					this._superApply = _superApply;

					returnValue = value.apply( this, arguments );

					this._super = __super;
					this._superApply = __superApply;

					return returnValue;
				};
			} )();
		} );
		constructor.prototype = $.widget.extend( basePrototype, {

			// TODO: remove support for widgetEventPrefix
			// always use the name + a colon as the prefix, e.g., draggable:start
			// don't prefix for widgets that aren't DOM-based
			widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
		}, proxiedPrototype, {
			constructor: constructor,
			namespace: namespace,
			widgetName: name,
			widgetFullName: fullName
		} );

		// If this widget is being redefined then we need to find all widgets that
		// are inheriting from it and redefine all of them so that they inherit from
		// the new version of this widget. We're essentially trying to replace one
		// level in the prototype chain.
		if ( existingConstructor ) {
			$.each( existingConstructor._childConstructors, function( i, child ) {
				var childPrototype = child.prototype;

				// Redefine the child widget using the same prototype that was
				// originally used, but inherit from the new version of the base
				$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor,
					child._proto );
			} );

			// Remove the list of existing child constructors from the old constructor
			// so the old child constructors can be garbage collected
			delete existingConstructor._childConstructors;
		} else {
			base._childConstructors.push( constructor );
		}

		$.widget.bridge( name, constructor );

		return constructor;
	};

	$.widget.extend = function( target ) {
		var input = widgetSlice.call( arguments, 1 );
		var inputIndex = 0;
		var inputLength = input.length;
		var key;
		var value;

		for ( ; inputIndex < inputLength; inputIndex++ ) {
			for ( key in input[ inputIndex ] ) {
				value = input[ inputIndex ][ key ];
				if ( widgetHasOwnProperty.call( input[ inputIndex ], key ) && value !== undefined ) {

					// Clone objects
					if ( $.isPlainObject( value ) ) {
						target[ key ] = $.isPlainObject( target[ key ] ) ?
							$.widget.extend( {}, target[ key ], value ) :

							// Don't extend strings, arrays, etc. with objects
							$.widget.extend( {}, value );

						// Copy everything else by reference
					} else {
						target[ key ] = value;
					}
				}
			}
		}
		return target;
	};

	$.widget.bridge = function( name, object ) {
		var fullName = object.prototype.widgetFullName || name;
		$.fn[ name ] = function( options ) {
			var isMethodCall = typeof options === "string";
			var args = widgetSlice.call( arguments, 1 );
			var returnValue = this;

			if ( isMethodCall ) {

				// If this is an empty collection, we need to have the instance method
				// return undefined instead of the jQuery instance
				if ( !this.length && options === "instance" ) {
					returnValue = undefined;
				} else {
					this.each( function() {
						var methodValue;
						var instance = $.data( this, fullName );

						if ( options === "instance" ) {
							returnValue = instance;
							return false;
						}

						if ( !instance ) {
							return $.error( "cannot call methods on " + name +
								" prior to initialization; " +
								"attempted to call method '" + options + "'" );
						}

						if ( typeof instance[ options ] !== "function" ||
							options.charAt( 0 ) === "_" ) {
							return $.error( "no such method '" + options + "' for " + name +
								" widget instance" );
						}

						methodValue = instance[ options ].apply( instance, args );

						if ( methodValue !== instance && methodValue !== undefined ) {
							returnValue = methodValue && methodValue.jquery ?
								returnValue.pushStack( methodValue.get() ) :
								methodValue;
							return false;
						}
					} );
				}
			} else {

				// Allow multiple hashes to be passed on init
				if ( args.length ) {
					options = $.widget.extend.apply( null, [ options ].concat( args ) );
				}

				this.each( function() {
					var instance = $.data( this, fullName );
					if ( instance ) {
						instance.option( options || {} );
						if ( instance._init ) {
							instance._init();
						}
					} else {
						$.data( this, fullName, new object( options, this ) );
					}
				} );
			}

			return returnValue;
		};
	};

	$.Widget = function( /* options, element */ ) {};
	$.Widget._childConstructors = [];

	$.Widget.prototype = {
		widgetName: "widget",
		widgetEventPrefix: "",
		defaultElement: "<div>",

		options: {
			classes: {},
			disabled: false,

			// Callbacks
			create: null
		},

		_createWidget: function( options, element ) {
			element = $( element || this.defaultElement || this )[ 0 ];
			this.element = $( element );
			this.uuid = widgetUuid++;
			this.eventNamespace = "." + this.widgetName + this.uuid;

			this.bindings = $();
			this.hoverable = $();
			this.focusable = $();
			this.classesElementLookup = {};

			if ( element !== this ) {
				$.data( element, this.widgetFullName, this );
				this._on( true, this.element, {
					remove: function( event ) {
						if ( event.target === element ) {
							this.destroy();
						}
					}
				} );
				this.document = $( element.style ?

					// Element within the document
					element.ownerDocument :

					// Element is window or document
					element.document || element );
				this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
			}

			this.options = $.widget.extend( {},
				this.options,
				this._getCreateOptions(),
				options );

			this._create();

			if ( this.options.disabled ) {
				this._setOptionDisabled( this.options.disabled );
			}

			this._trigger( "create", null, this._getCreateEventData() );
			this._init();
		},

		_getCreateOptions: function() {
			return {};
		},

		_getCreateEventData: $.noop,

		_create: $.noop,

		_init: $.noop,

		destroy: function() {
			var that = this;

			this._destroy();
			$.each( this.classesElementLookup, function( key, value ) {
				that._removeClass( value, key );
			} );

			// We can probably remove the unbind calls in 2.0
			// all event bindings should go through this._on()
			this.element
			.off( this.eventNamespace )
			.removeData( this.widgetFullName );
			this.widget()
			.off( this.eventNamespace )
			.removeAttr( "aria-disabled" );

			// Clean up events and states
			this.bindings.off( this.eventNamespace );
		},

		_destroy: $.noop,

		widget: function() {
			return this.element;
		},

		option: function( key, value ) {
			var options = key;
			var parts;
			var curOption;
			var i;

			if ( arguments.length === 0 ) {

				// Don't return a reference to the internal hash
				return $.widget.extend( {}, this.options );
			}

			if ( typeof key === "string" ) {

				// Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
				options = {};
				parts = key.split( "." );
				key = parts.shift();
				if ( parts.length ) {
					curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
					for ( i = 0; i < parts.length - 1; i++ ) {
						curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
						curOption = curOption[ parts[ i ] ];
					}
					key = parts.pop();
					if ( arguments.length === 1 ) {
						return curOption[ key ] === undefined ? null : curOption[ key ];
					}
					curOption[ key ] = value;
				} else {
					if ( arguments.length === 1 ) {
						return this.options[ key ] === undefined ? null : this.options[ key ];
					}
					options[ key ] = value;
				}
			}

			this._setOptions( options );

			return this;
		},

		_setOptions: function( options ) {
			var key;

			for ( key in options ) {
				this._setOption( key, options[ key ] );
			}

			return this;
		},

		_setOption: function( key, value ) {
			if ( key === "classes" ) {
				this._setOptionClasses( value );
			}

			this.options[ key ] = value;

			if ( key === "disabled" ) {
				this._setOptionDisabled( value );
			}

			return this;
		},

		_setOptionClasses: function( value ) {
			var classKey, elements, currentElements;

			for ( classKey in value ) {
				currentElements = this.classesElementLookup[ classKey ];
				if ( value[ classKey ] === this.options.classes[ classKey ] ||
					!currentElements ||
					!currentElements.length ) {
					continue;
				}

				// We are doing this to create a new jQuery object because the _removeClass() call
				// on the next line is going to destroy the reference to the current elements being
				// tracked. We need to save a copy of this collection so that we can add the new classes
				// below.
				elements = $( currentElements.get() );
				this._removeClass( currentElements, classKey );

				// We don't use _addClass() here, because that uses this.options.classes
				// for generating the string of classes. We want to use the value passed in from
				// _setOption(), this is the new value of the classes option which was passed to
				// _setOption(). We pass this value directly to _classes().
				elements.addClass( this._classes( {
					element: elements,
					keys: classKey,
					classes: value,
					add: true
				} ) );
			}
		},

		_setOptionDisabled: function( value ) {
			this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

			// If the widget is becoming disabled, then nothing is interactive
			if ( value ) {
				this._removeClass( this.hoverable, null, "ui-state-hover" );
				this._removeClass( this.focusable, null, "ui-state-focus" );
			}
		},

		enable: function() {
			return this._setOptions( { disabled: false } );
		},

		disable: function() {
			return this._setOptions( { disabled: true } );
		},

		_classes: function( options ) {
			var full = [];
			var that = this;

			options = $.extend( {
				element: this.element,
				classes: this.options.classes || {}
			}, options );

			function bindRemoveEvent() {
				options.element.each( function( _, element ) {
					var isTracked = $.map( that.classesElementLookup, function( elements ) {
						return elements;
					} )
					.some( function( elements ) {
						return elements.is( element );
					} );

					if ( !isTracked ) {
						that._on( $( element ), {
							remove: "_untrackClassesElement"
						} );
					}
				} );
			}

			function processClassString( classes, checkOption ) {
				var current, i;
				for ( i = 0; i < classes.length; i++ ) {
					current = that.classesElementLookup[ classes[ i ] ] || $();
					if ( options.add ) {
						bindRemoveEvent();
						current = $( $.uniqueSort( current.get().concat( options.element.get() ) ) );
					} else {
						current = $( current.not( options.element ).get() );
					}
					that.classesElementLookup[ classes[ i ] ] = current;
					full.push( classes[ i ] );
					if ( checkOption && options.classes[ classes[ i ] ] ) {
						full.push( options.classes[ classes[ i ] ] );
					}
				}
			}

			if ( options.keys ) {
				processClassString( options.keys.match( /\S+/g ) || [], true );
			}
			if ( options.extra ) {
				processClassString( options.extra.match( /\S+/g ) || [] );
			}

			return full.join( " " );
		},

		_untrackClassesElement: function( event ) {
			var that = this;
			$.each( that.classesElementLookup, function( key, value ) {
				if ( $.inArray( event.target, value ) !== -1 ) {
					that.classesElementLookup[ key ] = $( value.not( event.target ).get() );
				}
			} );

			this._off( $( event.target ) );
		},

		_removeClass: function( element, keys, extra ) {
			return this._toggleClass( element, keys, extra, false );
		},

		_addClass: function( element, keys, extra ) {
			return this._toggleClass( element, keys, extra, true );
		},

		_toggleClass: function( element, keys, extra, add ) {
			add = ( typeof add === "boolean" ) ? add : extra;
			var shift = ( typeof element === "string" || element === null ),
				options = {
					extra: shift ? keys : extra,
					keys: shift ? element : keys,
					element: shift ? this.element : element,
					add: add
				};
			options.element.toggleClass( this._classes( options ), add );
			return this;
		},

		_on: function( suppressDisabledCheck, element, handlers ) {
			var delegateElement;
			var instance = this;

			// No suppressDisabledCheck flag, shuffle arguments
			if ( typeof suppressDisabledCheck !== "boolean" ) {
				handlers = element;
				element = suppressDisabledCheck;
				suppressDisabledCheck = false;
			}

			// No element argument, shuffle and use this.element
			if ( !handlers ) {
				handlers = element;
				element = this.element;
				delegateElement = this.widget();
			} else {
				element = delegateElement = $( element );
				this.bindings = this.bindings.add( element );
			}

			$.each( handlers, function( event, handler ) {
				function handlerProxy() {

					// Allow widgets to customize the disabled handling
					// - disabled as an array instead of boolean
					// - disabled class as method for disabling individual parts
					if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
						return;
					}
					return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
				}

				// Copy the guid so direct unbinding works
				if ( typeof handler !== "string" ) {
					handlerProxy.guid = handler.guid =
						handler.guid || handlerProxy.guid || $.guid++;
				}

				var match = event.match( /^([\w:-]*)\s*(.*)$/ );
				var eventName = match[ 1 ] + instance.eventNamespace;
				var selector = match[ 2 ];

				if ( selector ) {
					delegateElement.on( eventName, selector, handlerProxy );
				} else {
					element.on( eventName, handlerProxy );
				}
			} );
		},

		_off: function( element, eventName ) {
			eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
				this.eventNamespace;
			element.off( eventName );

			// Clear the stack to avoid memory leaks (#10056)
			this.bindings = $( this.bindings.not( element ).get() );
			this.focusable = $( this.focusable.not( element ).get() );
			this.hoverable = $( this.hoverable.not( element ).get() );
		},

		_delay: function( handler, delay ) {
			function handlerProxy() {
				return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
			}
			var instance = this;
			return setTimeout( handlerProxy, delay || 0 );
		},

		_hoverable: function( element ) {
			this.hoverable = this.hoverable.add( element );
			this._on( element, {
				mouseenter: function( event ) {
					this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
				},
				mouseleave: function( event ) {
					this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
				}
			} );
		},

		_focusable: function( element ) {
			this.focusable = this.focusable.add( element );
			this._on( element, {
				focusin: function( event ) {
					this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
				},
				focusout: function( event ) {
					this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
				}
			} );
		},

		_trigger: function( type, event, data ) {
			var prop, orig;
			var callback = this.options[ type ];

			data = data || {};
			event = $.Event( event );
			event.type = ( type === this.widgetEventPrefix ?
				type :
				this.widgetEventPrefix + type ).toLowerCase();

			// The original event may come from any element
			// so we need to reset the target on the new event
			event.target = this.element[ 0 ];

			// Copy original event properties over to the new event
			orig = event.originalEvent;
			if ( orig ) {
				for ( prop in orig ) {
					if ( !( prop in event ) ) {
						event[ prop ] = orig[ prop ];
					}
				}
			}

			this.element.trigger( event, data );
			return !( typeof callback === "function" &&
				callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
				event.isDefaultPrevented() );
		}
	};

	$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
		$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
			if ( typeof options === "string" ) {
				options = { effect: options };
			}

			var hasOptions;
			var effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;

			options = options || {};
			if ( typeof options === "number" ) {
				options = { duration: options };
			} else if ( options === true ) {
				options = {};
			}

			hasOptions = !$.isEmptyObject( options );
			options.complete = callback;

			if ( options.delay ) {
				element.delay( options.delay );
			}

			if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
				element[ method ]( options );
			} else if ( effectName !== method && element[ effectName ] ) {
				element[ effectName ]( options.duration, options.easing, callback );
			} else {
				element.queue( function( next ) {
					$( this )[ method ]();
					if ( callback ) {
						callback.call( element[ 0 ] );
					}
					next();
				} );
			}
		};
	} );

	var widget = $.widget;


	/*!
 * jQuery UI Position 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/position/
 */

//>>label: Position
//>>group: Core
//>>description: Positions elements relative to other elements.
//>>docs: http://api.jqueryui.com/position/
//>>demos: http://jqueryui.com/position/


	( function() {
		var cachedScrollbarWidth,
			max = Math.max,
			abs = Math.abs,
			rhorizontal = /left|center|right/,
			rvertical = /top|center|bottom/,
			roffset = /[\+\-]\d+(\.[\d]+)?%?/,
			rposition = /^\w+/,
			rpercent = /%$/,
			_position = $.fn.position;

		function getOffsets( offsets, width, height ) {
			return [
				parseFloat( offsets[ 0 ] ) * ( rpercent.test( offsets[ 0 ] ) ? width / 100 : 1 ),
				parseFloat( offsets[ 1 ] ) * ( rpercent.test( offsets[ 1 ] ) ? height / 100 : 1 )
			];
		}

		function parseCss( element, property ) {
			return parseInt( $.css( element, property ), 10 ) || 0;
		}

		function isWindow( obj ) {
			return obj != null && obj === obj.window;
		}

		function getDimensions( elem ) {
			var raw = elem[ 0 ];
			if ( raw.nodeType === 9 ) {
				return {
					width: elem.width(),
					height: elem.height(),
					offset: { top: 0, left: 0 }
				};
			}
			if ( isWindow( raw ) ) {
				return {
					width: elem.width(),
					height: elem.height(),
					offset: { top: elem.scrollTop(), left: elem.scrollLeft() }
				};
			}
			if ( raw.preventDefault ) {
				return {
					width: 0,
					height: 0,
					offset: { top: raw.pageY, left: raw.pageX }
				};
			}
			return {
				width: elem.outerWidth(),
				height: elem.outerHeight(),
				offset: elem.offset()
			};
		}

		$.position = {
			scrollbarWidth: function() {
				if ( cachedScrollbarWidth !== undefined ) {
					return cachedScrollbarWidth;
				}
				var w1, w2,
					div = $( "<div style=" +
						"'display:block;position:absolute;width:200px;height:200px;overflow:hidden;'>" +
						"<div style='height:300px;width:auto;'></div></div>" ),
					innerDiv = div.children()[ 0 ];

				$( "body" ).append( div );
				w1 = innerDiv.offsetWidth;
				div.css( "overflow", "scroll" );

				w2 = innerDiv.offsetWidth;

				if ( w1 === w2 ) {
					w2 = div[ 0 ].clientWidth;
				}

				div.remove();

				return ( cachedScrollbarWidth = w1 - w2 );
			},
			getScrollInfo: function( within ) {
				var overflowX = within.isWindow || within.isDocument ? "" :
						within.element.css( "overflow-x" ),
					overflowY = within.isWindow || within.isDocument ? "" :
						within.element.css( "overflow-y" ),
					hasOverflowX = overflowX === "scroll" ||
						( overflowX === "auto" && within.width < within.element[ 0 ].scrollWidth ),
					hasOverflowY = overflowY === "scroll" ||
						( overflowY === "auto" && within.height < within.element[ 0 ].scrollHeight );
				return {
					width: hasOverflowY ? $.position.scrollbarWidth() : 0,
					height: hasOverflowX ? $.position.scrollbarWidth() : 0
				};
			},
			getWithinInfo: function( element ) {
				var withinElement = $( element || window ),
					isElemWindow = isWindow( withinElement[ 0 ] ),
					isDocument = !!withinElement[ 0 ] && withinElement[ 0 ].nodeType === 9,
					hasOffset = !isElemWindow && !isDocument;
				return {
					element: withinElement,
					isWindow: isElemWindow,
					isDocument: isDocument,
					offset: hasOffset ? $( element ).offset() : { left: 0, top: 0 },
					scrollLeft: withinElement.scrollLeft(),
					scrollTop: withinElement.scrollTop(),
					width: withinElement.outerWidth(),
					height: withinElement.outerHeight()
				};
			}
		};

		$.fn.position = function( options ) {
			if ( !options || !options.of ) {
				return _position.apply( this, arguments );
			}

			// Make a copy, we don't want to modify arguments
			options = $.extend( {}, options );

			var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,

				// Make sure string options are treated as CSS selectors
				target = typeof options.of === "string" ?
					$( document ).find( options.of ) :
					$( options.of ),

				within = $.position.getWithinInfo( options.within ),
				scrollInfo = $.position.getScrollInfo( within ),
				collision = ( options.collision || "flip" ).split( " " ),
				offsets = {};

			dimensions = getDimensions( target );
			if ( target[ 0 ].preventDefault ) {

				// Force left top to allow flipping
				options.at = "left top";
			}
			targetWidth = dimensions.width;
			targetHeight = dimensions.height;
			targetOffset = dimensions.offset;

			// Clone to reuse original targetOffset later
			basePosition = $.extend( {}, targetOffset );

			// Force my and at to have valid horizontal and vertical positions
			// if a value is missing or invalid, it will be converted to center
			$.each( [ "my", "at" ], function() {
				var pos = ( options[ this ] || "" ).split( " " ),
					horizontalOffset,
					verticalOffset;

				if ( pos.length === 1 ) {
					pos = rhorizontal.test( pos[ 0 ] ) ?
						pos.concat( [ "center" ] ) :
						rvertical.test( pos[ 0 ] ) ?
							[ "center" ].concat( pos ) :
							[ "center", "center" ];
				}
				pos[ 0 ] = rhorizontal.test( pos[ 0 ] ) ? pos[ 0 ] : "center";
				pos[ 1 ] = rvertical.test( pos[ 1 ] ) ? pos[ 1 ] : "center";

				// Calculate offsets
				horizontalOffset = roffset.exec( pos[ 0 ] );
				verticalOffset = roffset.exec( pos[ 1 ] );
				offsets[ this ] = [
					horizontalOffset ? horizontalOffset[ 0 ] : 0,
					verticalOffset ? verticalOffset[ 0 ] : 0
				];

				// Reduce to just the positions without the offsets
				options[ this ] = [
					rposition.exec( pos[ 0 ] )[ 0 ],
					rposition.exec( pos[ 1 ] )[ 0 ]
				];
			} );

			// Normalize collision option
			if ( collision.length === 1 ) {
				collision[ 1 ] = collision[ 0 ];
			}

			if ( options.at[ 0 ] === "right" ) {
				basePosition.left += targetWidth;
			} else if ( options.at[ 0 ] === "center" ) {
				basePosition.left += targetWidth / 2;
			}

			if ( options.at[ 1 ] === "bottom" ) {
				basePosition.top += targetHeight;
			} else if ( options.at[ 1 ] === "center" ) {
				basePosition.top += targetHeight / 2;
			}

			atOffset = getOffsets( offsets.at, targetWidth, targetHeight );
			basePosition.left += atOffset[ 0 ];
			basePosition.top += atOffset[ 1 ];

			return this.each( function() {
				var collisionPosition, using,
					elem = $( this ),
					elemWidth = elem.outerWidth(),
					elemHeight = elem.outerHeight(),
					marginLeft = parseCss( this, "marginLeft" ),
					marginTop = parseCss( this, "marginTop" ),
					collisionWidth = elemWidth + marginLeft + parseCss( this, "marginRight" ) +
						scrollInfo.width,
					collisionHeight = elemHeight + marginTop + parseCss( this, "marginBottom" ) +
						scrollInfo.height,
					position = $.extend( {}, basePosition ),
					myOffset = getOffsets( offsets.my, elem.outerWidth(), elem.outerHeight() );

				if ( options.my[ 0 ] === "right" ) {
					position.left -= elemWidth;
				} else if ( options.my[ 0 ] === "center" ) {
					position.left -= elemWidth / 2;
				}

				if ( options.my[ 1 ] === "bottom" ) {
					position.top -= elemHeight;
				} else if ( options.my[ 1 ] === "center" ) {
					position.top -= elemHeight / 2;
				}

				position.left += myOffset[ 0 ];
				position.top += myOffset[ 1 ];

				collisionPosition = {
					marginLeft: marginLeft,
					marginTop: marginTop
				};

				$.each( [ "left", "top" ], function( i, dir ) {
					if ( $.ui.position[ collision[ i ] ] ) {
						$.ui.position[ collision[ i ] ][ dir ]( position, {
							targetWidth: targetWidth,
							targetHeight: targetHeight,
							elemWidth: elemWidth,
							elemHeight: elemHeight,
							collisionPosition: collisionPosition,
							collisionWidth: collisionWidth,
							collisionHeight: collisionHeight,
							offset: [ atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ] ],
							my: options.my,
							at: options.at,
							within: within,
							elem: elem
						} );
					}
				} );

				if ( options.using ) {

					// Adds feedback as second argument to using callback, if present
					using = function( props ) {
						var left = targetOffset.left - position.left,
							right = left + targetWidth - elemWidth,
							top = targetOffset.top - position.top,
							bottom = top + targetHeight - elemHeight,
							feedback = {
								target: {
									element: target,
									left: targetOffset.left,
									top: targetOffset.top,
									width: targetWidth,
									height: targetHeight
								},
								element: {
									element: elem,
									left: position.left,
									top: position.top,
									width: elemWidth,
									height: elemHeight
								},
								horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
								vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
							};
						if ( targetWidth < elemWidth && abs( left + right ) < targetWidth ) {
							feedback.horizontal = "center";
						}
						if ( targetHeight < elemHeight && abs( top + bottom ) < targetHeight ) {
							feedback.vertical = "middle";
						}
						if ( max( abs( left ), abs( right ) ) > max( abs( top ), abs( bottom ) ) ) {
							feedback.important = "horizontal";
						} else {
							feedback.important = "vertical";
						}
						options.using.call( this, props, feedback );
					};
				}

				elem.offset( $.extend( position, { using: using } ) );
			} );
		};

		$.ui.position = {
			fit: {
				left: function( position, data ) {
					var within = data.within,
						withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
						outerWidth = within.width,
						collisionPosLeft = position.left - data.collisionPosition.marginLeft,
						overLeft = withinOffset - collisionPosLeft,
						overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
						newOverRight;

					// Element is wider than within
					if ( data.collisionWidth > outerWidth ) {

						// Element is initially over the left side of within
						if ( overLeft > 0 && overRight <= 0 ) {
							newOverRight = position.left + overLeft + data.collisionWidth - outerWidth -
								withinOffset;
							position.left += overLeft - newOverRight;

							// Element is initially over right side of within
						} else if ( overRight > 0 && overLeft <= 0 ) {
							position.left = withinOffset;

							// Element is initially over both left and right sides of within
						} else {
							if ( overLeft > overRight ) {
								position.left = withinOffset + outerWidth - data.collisionWidth;
							} else {
								position.left = withinOffset;
							}
						}

						// Too far left -> align with left edge
					} else if ( overLeft > 0 ) {
						position.left += overLeft;

						// Too far right -> align with right edge
					} else if ( overRight > 0 ) {
						position.left -= overRight;

						// Adjust based on position and margin
					} else {
						position.left = max( position.left - collisionPosLeft, position.left );
					}
				},
				top: function( position, data ) {
					var within = data.within,
						withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
						outerHeight = data.within.height,
						collisionPosTop = position.top - data.collisionPosition.marginTop,
						overTop = withinOffset - collisionPosTop,
						overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
						newOverBottom;

					// Element is taller than within
					if ( data.collisionHeight > outerHeight ) {

						// Element is initially over the top of within
						if ( overTop > 0 && overBottom <= 0 ) {
							newOverBottom = position.top + overTop + data.collisionHeight - outerHeight -
								withinOffset;
							position.top += overTop - newOverBottom;

							// Element is initially over bottom of within
						} else if ( overBottom > 0 && overTop <= 0 ) {
							position.top = withinOffset;

							// Element is initially over both top and bottom of within
						} else {
							if ( overTop > overBottom ) {
								position.top = withinOffset + outerHeight - data.collisionHeight;
							} else {
								position.top = withinOffset;
							}
						}

						// Too far up -> align with top
					} else if ( overTop > 0 ) {
						position.top += overTop;

						// Too far down -> align with bottom edge
					} else if ( overBottom > 0 ) {
						position.top -= overBottom;

						// Adjust based on position and margin
					} else {
						position.top = max( position.top - collisionPosTop, position.top );
					}
				}
			},
			flip: {
				left: function( position, data ) {
					var within = data.within,
						withinOffset = within.offset.left + within.scrollLeft,
						outerWidth = within.width,
						offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
						collisionPosLeft = position.left - data.collisionPosition.marginLeft,
						overLeft = collisionPosLeft - offsetLeft,
						overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
						myOffset = data.my[ 0 ] === "left" ?
							-data.elemWidth :
							data.my[ 0 ] === "right" ?
								data.elemWidth :
								0,
						atOffset = data.at[ 0 ] === "left" ?
							data.targetWidth :
							data.at[ 0 ] === "right" ?
								-data.targetWidth :
								0,
						offset = -2 * data.offset[ 0 ],
						newOverRight,
						newOverLeft;

					if ( overLeft < 0 ) {
						newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth -
							outerWidth - withinOffset;
						if ( newOverRight < 0 || newOverRight < abs( overLeft ) ) {
							position.left += myOffset + atOffset + offset;
						}
					} else if ( overRight > 0 ) {
						newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset +
							atOffset + offset - offsetLeft;
						if ( newOverLeft > 0 || abs( newOverLeft ) < overRight ) {
							position.left += myOffset + atOffset + offset;
						}
					}
				},
				top: function( position, data ) {
					var within = data.within,
						withinOffset = within.offset.top + within.scrollTop,
						outerHeight = within.height,
						offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
						collisionPosTop = position.top - data.collisionPosition.marginTop,
						overTop = collisionPosTop - offsetTop,
						overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
						top = data.my[ 1 ] === "top",
						myOffset = top ?
							-data.elemHeight :
							data.my[ 1 ] === "bottom" ?
								data.elemHeight :
								0,
						atOffset = data.at[ 1 ] === "top" ?
							data.targetHeight :
							data.at[ 1 ] === "bottom" ?
								-data.targetHeight :
								0,
						offset = -2 * data.offset[ 1 ],
						newOverTop,
						newOverBottom;
					if ( overTop < 0 ) {
						newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight -
							outerHeight - withinOffset;
						if ( newOverBottom < 0 || newOverBottom < abs( overTop ) ) {
							position.top += myOffset + atOffset + offset;
						}
					} else if ( overBottom > 0 ) {
						newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset +
							offset - offsetTop;
						if ( newOverTop > 0 || abs( newOverTop ) < overBottom ) {
							position.top += myOffset + atOffset + offset;
						}
					}
				}
			},
			flipfit: {
				left: function() {
					$.ui.position.flip.left.apply( this, arguments );
					$.ui.position.fit.left.apply( this, arguments );
				},
				top: function() {
					$.ui.position.flip.top.apply( this, arguments );
					$.ui.position.fit.top.apply( this, arguments );
				}
			}
		};

	} )();

	var position = $.ui.position;


	/*!
 * jQuery UI :data 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: :data Selector
//>>group: Core
//>>description: Selects elements which have data stored under the specified key.
//>>docs: http://api.jqueryui.com/data-selector/


	var data = $.extend( $.expr.pseudos, {
		data: $.expr.createPseudo ?
			$.expr.createPseudo( function( dataName ) {
				return function( elem ) {
					return !!$.data( elem, dataName );
				};
			} ) :

			// Support: jQuery <1.8
			function( elem, i, match ) {
				return !!$.data( elem, match[ 3 ] );
			}
	} );

	/*!
 * jQuery UI Disable Selection 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: disableSelection
//>>group: Core
//>>description: Disable selection of text content within the set of matched elements.
//>>docs: http://api.jqueryui.com/disableSelection/

// This file is deprecated

	var disableSelection = $.fn.extend( {
		disableSelection: ( function() {
			var eventType = "onselectstart" in document.createElement( "div" ) ?
				"selectstart" :
				"mousedown";

			return function() {
				return this.on( eventType + ".ui-disableSelection", function( event ) {
					event.preventDefault();
				} );
			};
		} )(),

		enableSelection: function() {
			return this.off( ".ui-disableSelection" );
		}
	} );



// Create a local jQuery because jQuery Color relies on it and the
// global may not exist with AMD and a custom build (#10199).
// This module is a noop if used as a regular AMD module.
// eslint-disable-next-line no-unused-vars
	var jQuery = $;


	/*!
 * jQuery Color Animations v2.2.0
 * https://github.com/jquery/jquery-color
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * Date: Sun May 10 09:02:36 2020 +0200
 */



	var stepHooks = "backgroundColor borderBottomColor borderLeftColor borderRightColor " +
			"borderTopColor color columnRuleColor outlineColor textDecorationColor textEmphasisColor",

		class2type = {},
		toString = class2type.toString,

		// plusequals test for += 100 -= 100
		rplusequals = /^([\-+])=\s*(\d+\.?\d*)/,

		// a set of RE's that can match strings and generate color tuples.
		stringParsers = [ {
			re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ],
					execResult[ 3 ],
					execResult[ 4 ]
				];
			}
		}, {
			re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			parse: function( execResult ) {
				return [
					execResult[ 1 ] * 2.55,
					execResult[ 2 ] * 2.55,
					execResult[ 3 ] * 2.55,
					execResult[ 4 ]
				];
			}
		}, {

			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})?/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ], 16 ),
					execResult[ 4 ] ?
						( parseInt( execResult[ 4 ], 16 ) / 255 ).toFixed( 2 ) :
						1
				];
			}
		}, {

			// this regex ignores A-F because it's compared against an already lowercased string
			re: /#([a-f0-9])([a-f0-9])([a-f0-9])([a-f0-9])?/,
			parse: function( execResult ) {
				return [
					parseInt( execResult[ 1 ] + execResult[ 1 ], 16 ),
					parseInt( execResult[ 2 ] + execResult[ 2 ], 16 ),
					parseInt( execResult[ 3 ] + execResult[ 3 ], 16 ),
					execResult[ 4 ] ?
						( parseInt( execResult[ 4 ] + execResult[ 4 ], 16 ) / 255 )
						.toFixed( 2 ) :
						1
				];
			}
		}, {
			re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d?(?:\.\d+)?)\s*)?\)/,
			space: "hsla",
			parse: function( execResult ) {
				return [
					execResult[ 1 ],
					execResult[ 2 ] / 100,
					execResult[ 3 ] / 100,
					execResult[ 4 ]
				];
			}
		} ],

		// jQuery.Color( )
		color = jQuery.Color = function( color, green, blue, alpha ) {
			return new jQuery.Color.fn.parse( color, green, blue, alpha );
		},
		spaces = {
			rgba: {
				props: {
					red: {
						idx: 0,
						type: "byte"
					},
					green: {
						idx: 1,
						type: "byte"
					},
					blue: {
						idx: 2,
						type: "byte"
					}
				}
			},

			hsla: {
				props: {
					hue: {
						idx: 0,
						type: "degrees"
					},
					saturation: {
						idx: 1,
						type: "percent"
					},
					lightness: {
						idx: 2,
						type: "percent"
					}
				}
			}
		},
		propTypes = {
			"byte": {
				floor: true,
				max: 255
			},
			"percent": {
				max: 1
			},
			"degrees": {
				mod: 360,
				floor: true
			}
		},
		support = color.support = {},

		// element for support tests
		supportElem = jQuery( "<p>" )[ 0 ],

		// colors = jQuery.Color.names
		colors,

		// local aliases of functions called often
		each = jQuery.each;

// determine rgba support immediately
	supportElem.style.cssText = "background-color:rgba(1,1,1,.5)";
	support.rgba = supportElem.style.backgroundColor.indexOf( "rgba" ) > -1;

// define cache name and alpha properties
// for rgba and hsla spaces
	each( spaces, function( spaceName, space ) {
		space.cache = "_" + spaceName;
		space.props.alpha = {
			idx: 3,
			type: "percent",
			def: 1
		};
	} );

// Populate the class2type map
	jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
		function( _i, name ) {
			class2type[ "[object " + name + "]" ] = name.toLowerCase();
		} );

	function getType( obj ) {
		if ( obj == null ) {
			return obj + "";
		}

		return typeof obj === "object" ?
			class2type[ toString.call( obj ) ] || "object" :
			typeof obj;
	}

	function clamp( value, prop, allowEmpty ) {
		var type = propTypes[ prop.type ] || {};

		if ( value == null ) {
			return ( allowEmpty || !prop.def ) ? null : prop.def;
		}

		// ~~ is an short way of doing floor for positive numbers
		value = type.floor ? ~~value : parseFloat( value );

		// IE will pass in empty strings as value for alpha,
		// which will hit this case
		if ( isNaN( value ) ) {
			return prop.def;
		}

		if ( type.mod ) {

			// we add mod before modding to make sure that negatives values
			// get converted properly: -10 -> 350
			return ( value + type.mod ) % type.mod;
		}

		// for now all property types without mod have min and max
		return Math.min( type.max, Math.max( 0, value ) );
	}

	function stringParse( string ) {
		var inst = color(),
			rgba = inst._rgba = [];

		string = string.toLowerCase();

		each( stringParsers, function( _i, parser ) {
			var parsed,
				match = parser.re.exec( string ),
				values = match && parser.parse( match ),
				spaceName = parser.space || "rgba";

			if ( values ) {
				parsed = inst[ spaceName ]( values );

				// if this was an rgba parse the assignment might happen twice
				// oh well....
				inst[ spaces[ spaceName ].cache ] = parsed[ spaces[ spaceName ].cache ];
				rgba = inst._rgba = parsed._rgba;

				// exit each( stringParsers ) here because we matched
				return false;
			}
		} );

		// Found a stringParser that handled it
		if ( rgba.length ) {

			// if this came from a parsed string, force "transparent" when alpha is 0
			// chrome, (and maybe others) return "transparent" as rgba(0,0,0,0)
			if ( rgba.join() === "0,0,0,0" ) {
				jQuery.extend( rgba, colors.transparent );
			}
			return inst;
		}

		// named colors
		return colors[ string ];
	}

	color.fn = jQuery.extend( color.prototype, {
		parse: function( red, green, blue, alpha ) {
			if ( red === undefined ) {
				this._rgba = [ null, null, null, null ];
				return this;
			}
			if ( red.jquery || red.nodeType ) {
				red = jQuery( red ).css( green );
				green = undefined;
			}

			var inst = this,
				type = getType( red ),
				rgba = this._rgba = [];

			// more than 1 argument specified - assume ( red, green, blue, alpha )
			if ( green !== undefined ) {
				red = [ red, green, blue, alpha ];
				type = "array";
			}

			if ( type === "string" ) {
				return this.parse( stringParse( red ) || colors._default );
			}

			if ( type === "array" ) {
				each( spaces.rgba.props, function( _key, prop ) {
					rgba[ prop.idx ] = clamp( red[ prop.idx ], prop );
				} );
				return this;
			}

			if ( type === "object" ) {
				if ( red instanceof color ) {
					each( spaces, function( _spaceName, space ) {
						if ( red[ space.cache ] ) {
							inst[ space.cache ] = red[ space.cache ].slice();
						}
					} );
				} else {
					each( spaces, function( _spaceName, space ) {
						var cache = space.cache;
						each( space.props, function( key, prop ) {

							// if the cache doesn't exist, and we know how to convert
							if ( !inst[ cache ] && space.to ) {

								// if the value was null, we don't need to copy it
								// if the key was alpha, we don't need to copy it either
								if ( key === "alpha" || red[ key ] == null ) {
									return;
								}
								inst[ cache ] = space.to( inst._rgba );
							}

							// this is the only case where we allow nulls for ALL properties.
							// call clamp with alwaysAllowEmpty
							inst[ cache ][ prop.idx ] = clamp( red[ key ], prop, true );
						} );

						// everything defined but alpha?
						if ( inst[ cache ] && jQuery.inArray( null, inst[ cache ].slice( 0, 3 ) ) < 0 ) {

							// use the default of 1
							if ( inst[ cache ][ 3 ] == null ) {
								inst[ cache ][ 3 ] = 1;
							}

							if ( space.from ) {
								inst._rgba = space.from( inst[ cache ] );
							}
						}
					} );
				}
				return this;
			}
		},
		is: function( compare ) {
			var is = color( compare ),
				same = true,
				inst = this;

			each( spaces, function( _, space ) {
				var localCache,
					isCache = is[ space.cache ];
				if ( isCache ) {
					localCache = inst[ space.cache ] || space.to && space.to( inst._rgba ) || [];
					each( space.props, function( _, prop ) {
						if ( isCache[ prop.idx ] != null ) {
							same = ( isCache[ prop.idx ] === localCache[ prop.idx ] );
							return same;
						}
					} );
				}
				return same;
			} );
			return same;
		},
		_space: function() {
			var used = [],
				inst = this;
			each( spaces, function( spaceName, space ) {
				if ( inst[ space.cache ] ) {
					used.push( spaceName );
				}
			} );
			return used.pop();
		},
		transition: function( other, distance ) {
			var end = color( other ),
				spaceName = end._space(),
				space = spaces[ spaceName ],
				startColor = this.alpha() === 0 ? color( "transparent" ) : this,
				start = startColor[ space.cache ] || space.to( startColor._rgba ),
				result = start.slice();

			end = end[ space.cache ];
			each( space.props, function( _key, prop ) {
				var index = prop.idx,
					startValue = start[ index ],
					endValue = end[ index ],
					type = propTypes[ prop.type ] || {};

				// if null, don't override start value
				if ( endValue === null ) {
					return;
				}

				// if null - use end
				if ( startValue === null ) {
					result[ index ] = endValue;
				} else {
					if ( type.mod ) {
						if ( endValue - startValue > type.mod / 2 ) {
							startValue += type.mod;
						} else if ( startValue - endValue > type.mod / 2 ) {
							startValue -= type.mod;
						}
					}
					result[ index ] = clamp( ( endValue - startValue ) * distance + startValue, prop );
				}
			} );
			return this[ spaceName ]( result );
		},
		blend: function( opaque ) {

			// if we are already opaque - return ourself
			if ( this._rgba[ 3 ] === 1 ) {
				return this;
			}

			var rgb = this._rgba.slice(),
				a = rgb.pop(),
				blend = color( opaque )._rgba;

			return color( jQuery.map( rgb, function( v, i ) {
				return ( 1 - a ) * blend[ i ] + a * v;
			} ) );
		},
		toRgbaString: function() {
			var prefix = "rgba(",
				rgba = jQuery.map( this._rgba, function( v, i ) {
					if ( v != null ) {
						return v;
					}
					return i > 2 ? 1 : 0;
				} );

			if ( rgba[ 3 ] === 1 ) {
				rgba.pop();
				prefix = "rgb(";
			}

			return prefix + rgba.join() + ")";
		},
		toHslaString: function() {
			var prefix = "hsla(",
				hsla = jQuery.map( this.hsla(), function( v, i ) {
					if ( v == null ) {
						v = i > 2 ? 1 : 0;
					}

					// catch 1 and 2
					if ( i && i < 3 ) {
						v = Math.round( v * 100 ) + "%";
					}
					return v;
				} );

			if ( hsla[ 3 ] === 1 ) {
				hsla.pop();
				prefix = "hsl(";
			}
			return prefix + hsla.join() + ")";
		},
		toHexString: function( includeAlpha ) {
			var rgba = this._rgba.slice(),
				alpha = rgba.pop();

			if ( includeAlpha ) {
				rgba.push( ~~( alpha * 255 ) );
			}

			return "#" + jQuery.map( rgba, function( v ) {

				// default to 0 when nulls exist
				v = ( v || 0 ).toString( 16 );
				return v.length === 1 ? "0" + v : v;
			} ).join( "" );
		},
		toString: function() {
			return this._rgba[ 3 ] === 0 ? "transparent" : this.toRgbaString();
		}
	} );
	color.fn.parse.prototype = color.fn;

// hsla conversions adapted from:
// https://code.google.com/p/maashaack/source/browse/packages/graphics/trunk/src/graphics/colors/HUE2RGB.as?r=5021

	function hue2rgb( p, q, h ) {
		h = ( h + 1 ) % 1;
		if ( h * 6 < 1 ) {
			return p + ( q - p ) * h * 6;
		}
		if ( h * 2 < 1 ) {
			return q;
		}
		if ( h * 3 < 2 ) {
			return p + ( q - p ) * ( ( 2 / 3 ) - h ) * 6;
		}
		return p;
	}

	spaces.hsla.to = function( rgba ) {
		if ( rgba[ 0 ] == null || rgba[ 1 ] == null || rgba[ 2 ] == null ) {
			return [ null, null, null, rgba[ 3 ] ];
		}
		var r = rgba[ 0 ] / 255,
			g = rgba[ 1 ] / 255,
			b = rgba[ 2 ] / 255,
			a = rgba[ 3 ],
			max = Math.max( r, g, b ),
			min = Math.min( r, g, b ),
			diff = max - min,
			add = max + min,
			l = add * 0.5,
			h, s;

		if ( min === max ) {
			h = 0;
		} else if ( r === max ) {
			h = ( 60 * ( g - b ) / diff ) + 360;
		} else if ( g === max ) {
			h = ( 60 * ( b - r ) / diff ) + 120;
		} else {
			h = ( 60 * ( r - g ) / diff ) + 240;
		}

		// chroma (diff) == 0 means greyscale which, by definition, saturation = 0%
		// otherwise, saturation is based on the ratio of chroma (diff) to lightness (add)
		if ( diff === 0 ) {
			s = 0;
		} else if ( l <= 0.5 ) {
			s = diff / add;
		} else {
			s = diff / ( 2 - add );
		}
		return [ Math.round( h ) % 360, s, l, a == null ? 1 : a ];
	};

	spaces.hsla.from = function( hsla ) {
		if ( hsla[ 0 ] == null || hsla[ 1 ] == null || hsla[ 2 ] == null ) {
			return [ null, null, null, hsla[ 3 ] ];
		}
		var h = hsla[ 0 ] / 360,
			s = hsla[ 1 ],
			l = hsla[ 2 ],
			a = hsla[ 3 ],
			q = l <= 0.5 ? l * ( 1 + s ) : l + s - l * s,
			p = 2 * l - q;

		return [
			Math.round( hue2rgb( p, q, h + ( 1 / 3 ) ) * 255 ),
			Math.round( hue2rgb( p, q, h ) * 255 ),
			Math.round( hue2rgb( p, q, h - ( 1 / 3 ) ) * 255 ),
			a
		];
	};


	each( spaces, function( spaceName, space ) {
		var props = space.props,
			cache = space.cache,
			to = space.to,
			from = space.from;

		// makes rgba() and hsla()
		color.fn[ spaceName ] = function( value ) {

			// generate a cache for this space if it doesn't exist
			if ( to && !this[ cache ] ) {
				this[ cache ] = to( this._rgba );
			}
			if ( value === undefined ) {
				return this[ cache ].slice();
			}

			var ret,
				type = getType( value ),
				arr = ( type === "array" || type === "object" ) ? value : arguments,
				local = this[ cache ].slice();

			each( props, function( key, prop ) {
				var val = arr[ type === "object" ? key : prop.idx ];
				if ( val == null ) {
					val = local[ prop.idx ];
				}
				local[ prop.idx ] = clamp( val, prop );
			} );

			if ( from ) {
				ret = color( from( local ) );
				ret[ cache ] = local;
				return ret;
			} else {
				return color( local );
			}
		};

		// makes red() green() blue() alpha() hue() saturation() lightness()
		each( props, function( key, prop ) {

			// alpha is included in more than one space
			if ( color.fn[ key ] ) {
				return;
			}
			color.fn[ key ] = function( value ) {
				var local, cur, match, fn,
					vtype = getType( value );

				if ( key === "alpha" ) {
					fn = this._hsla ? "hsla" : "rgba";
				} else {
					fn = spaceName;
				}
				local = this[ fn ]();
				cur = local[ prop.idx ];

				if ( vtype === "undefined" ) {
					return cur;
				}

				if ( vtype === "function" ) {
					value = value.call( this, cur );
					vtype = getType( value );
				}
				if ( value == null && prop.empty ) {
					return this;
				}
				if ( vtype === "string" ) {
					match = rplusequals.exec( value );
					if ( match ) {
						value = cur + parseFloat( match[ 2 ] ) * ( match[ 1 ] === "+" ? 1 : -1 );
					}
				}
				local[ prop.idx ] = value;
				return this[ fn ]( local );
			};
		} );
	} );

// add cssHook and .fx.step function for each named hook.
// accept a space separated string of properties
	color.hook = function( hook ) {
		var hooks = hook.split( " " );
		each( hooks, function( _i, hook ) {
			jQuery.cssHooks[ hook ] = {
				set: function( elem, value ) {
					var parsed, curElem,
						backgroundColor = "";

					if ( value !== "transparent" && ( getType( value ) !== "string" || ( parsed = stringParse( value ) ) ) ) {
						value = color( parsed || value );
						if ( !support.rgba && value._rgba[ 3 ] !== 1 ) {
							curElem = hook === "backgroundColor" ? elem.parentNode : elem;
							while (
								( backgroundColor === "" || backgroundColor === "transparent" ) &&
								curElem && curElem.style
								) {
								try {
									backgroundColor = jQuery.css( curElem, "backgroundColor" );
									curElem = curElem.parentNode;
								} catch ( e ) {
								}
							}

							value = value.blend( backgroundColor && backgroundColor !== "transparent" ?
								backgroundColor :
								"_default" );
						}

						value = value.toRgbaString();
					}
					try {
						elem.style[ hook ] = value;
					} catch ( e ) {

						// wrapped to prevent IE from throwing errors on "invalid" values like 'auto' or 'inherit'
					}
				}
			};
			jQuery.fx.step[ hook ] = function( fx ) {
				if ( !fx.colorInit ) {
					fx.start = color( fx.elem, hook );
					fx.end = color( fx.end );
					fx.colorInit = true;
				}
				jQuery.cssHooks[ hook ].set( fx.elem, fx.start.transition( fx.end, fx.pos ) );
			};
		} );

	};

	color.hook( stepHooks );

	jQuery.cssHooks.borderColor = {
		expand: function( value ) {
			var expanded = {};

			each( [ "Top", "Right", "Bottom", "Left" ], function( _i, part ) {
				expanded[ "border" + part + "Color" ] = value;
			} );
			return expanded;
		}
	};

// Basic color names only.
// Usage of any of the other color names requires adding yourself or including
// jquery.color.svg-names.js.
	colors = jQuery.Color.names = {

		// 4.1. Basic color keywords
		aqua: "#00ffff",
		black: "#000000",
		blue: "#0000ff",
		fuchsia: "#ff00ff",
		gray: "#808080",
		green: "#008000",
		lime: "#00ff00",
		maroon: "#800000",
		navy: "#000080",
		olive: "#808000",
		purple: "#800080",
		red: "#ff0000",
		silver: "#c0c0c0",
		teal: "#008080",
		white: "#ffffff",
		yellow: "#ffff00",

		// 4.2.3. "transparent" color keyword
		transparent: [ null, null, null, 0 ],

		_default: "#ffffff"
	};


	/*!
 * jQuery UI Effects 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Effects Core
//>>group: Effects
	/* eslint-disable max-len */
//>>description: Extends the internal jQuery effects. Includes morphing and easing. Required by all other effects.
	/* eslint-enable max-len */
//>>docs: http://api.jqueryui.com/category/effects-core/
//>>demos: http://jqueryui.com/effect/


	var dataSpace = "ui-effects-",
		dataSpaceStyle = "ui-effects-style",
		dataSpaceAnimated = "ui-effects-animated";

	$.effects = {
		effect: {}
	};

	/******************************************************************************/
	/****************************** CLASS ANIMATIONS ******************************/
	/******************************************************************************/
	( function() {

		var classAnimationActions = [ "add", "remove", "toggle" ],
			shorthandStyles = {
				border: 1,
				borderBottom: 1,
				borderColor: 1,
				borderLeft: 1,
				borderRight: 1,
				borderTop: 1,
				borderWidth: 1,
				margin: 1,
				padding: 1
			};

		$.each(
			[ "borderLeftStyle", "borderRightStyle", "borderBottomStyle", "borderTopStyle" ],
			function( _, prop ) {
				$.fx.step[ prop ] = function( fx ) {
					if ( fx.end !== "none" && !fx.setAttr || fx.pos === 1 && !fx.setAttr ) {
						jQuery.style( fx.elem, prop, fx.end );
						fx.setAttr = true;
					}
				};
			}
		);

		function camelCase( string ) {
			return string.replace( /-([\da-z])/gi, function( all, letter ) {
				return letter.toUpperCase();
			} );
		}

		function getElementStyles( elem ) {
			var key, len,
				style = elem.ownerDocument.defaultView ?
					elem.ownerDocument.defaultView.getComputedStyle( elem, null ) :
					elem.currentStyle,
				styles = {};

			if ( style && style.length && style[ 0 ] && style[ style[ 0 ] ] ) {
				len = style.length;
				while ( len-- ) {
					key = style[ len ];
					if ( typeof style[ key ] === "string" ) {
						styles[ camelCase( key ) ] = style[ key ];
					}
				}

				// Support: Opera, IE <9
			} else {
				for ( key in style ) {
					if ( typeof style[ key ] === "string" ) {
						styles[ key ] = style[ key ];
					}
				}
			}

			return styles;
		}

		function styleDifference( oldStyle, newStyle ) {
			var diff = {},
				name, value;

			for ( name in newStyle ) {
				value = newStyle[ name ];
				if ( oldStyle[ name ] !== value ) {
					if ( !shorthandStyles[ name ] ) {
						if ( $.fx.step[ name ] || !isNaN( parseFloat( value ) ) ) {
							diff[ name ] = value;
						}
					}
				}
			}

			return diff;
		}

// Support: jQuery <1.8
		if ( !$.fn.addBack ) {
			$.fn.addBack = function( selector ) {
				return this.add( selector == null ?
					this.prevObject : this.prevObject.filter( selector )
				);
			};
		}

		$.effects.animateClass = function( value, duration, easing, callback ) {
			var o = $.speed( duration, easing, callback );

			return this.queue( function() {
				var animated = $( this ),
					baseClass = animated.attr( "class" ) || "",
					applyClassChange,
					allAnimations = o.children ? animated.find( "*" ).addBack() : animated;

				// Map the animated objects to store the original styles.
				allAnimations = allAnimations.map( function() {
					var el = $( this );
					return {
						el: el,
						start: getElementStyles( this )
					};
				} );

				// Apply class change
				applyClassChange = function() {
					$.each( classAnimationActions, function( i, action ) {
						if ( value[ action ] ) {
							animated[ action + "Class" ]( value[ action ] );
						}
					} );
				};
				applyClassChange();

				// Map all animated objects again - calculate new styles and diff
				allAnimations = allAnimations.map( function() {
					this.end = getElementStyles( this.el[ 0 ] );
					this.diff = styleDifference( this.start, this.end );
					return this;
				} );

				// Apply original class
				animated.attr( "class", baseClass );

				// Map all animated objects again - this time collecting a promise
				allAnimations = allAnimations.map( function() {
					var styleInfo = this,
						dfd = $.Deferred(),
						opts = $.extend( {}, o, {
							queue: false,
							complete: function() {
								dfd.resolve( styleInfo );
							}
						} );

					this.el.animate( this.diff, opts );
					return dfd.promise();
				} );

				// Once all animations have completed:
				$.when.apply( $, allAnimations.get() ).done( function() {

					// Set the final class
					applyClassChange();

					// For each animated element,
					// clear all css properties that were animated
					$.each( arguments, function() {
						var el = this.el;
						$.each( this.diff, function( key ) {
							el.css( key, "" );
						} );
					} );

					// This is guarnteed to be there if you use jQuery.speed()
					// it also handles dequeuing the next anim...
					o.complete.call( animated[ 0 ] );
				} );
			} );
		};

		$.fn.extend( {
			addClass: ( function( orig ) {
				return function( classNames, speed, easing, callback ) {
					return speed ?
						$.effects.animateClass.call( this,
							{ add: classNames }, speed, easing, callback ) :
						orig.apply( this, arguments );
				};
			} )( $.fn.addClass ),

			removeClass: ( function( orig ) {
				return function( classNames, speed, easing, callback ) {
					return arguments.length > 1 ?
						$.effects.animateClass.call( this,
							{ remove: classNames }, speed, easing, callback ) :
						orig.apply( this, arguments );
				};
			} )( $.fn.removeClass ),

			toggleClass: ( function( orig ) {
				return function( classNames, force, speed, easing, callback ) {
					if ( typeof force === "boolean" || force === undefined ) {
						if ( !speed ) {

							// Without speed parameter
							return orig.apply( this, arguments );
						} else {
							return $.effects.animateClass.call( this,
								( force ? { add: classNames } : { remove: classNames } ),
								speed, easing, callback );
						}
					} else {

						// Without force parameter
						return $.effects.animateClass.call( this,
							{ toggle: classNames }, force, speed, easing );
					}
				};
			} )( $.fn.toggleClass ),

			switchClass: function( remove, add, speed, easing, callback ) {
				return $.effects.animateClass.call( this, {
					add: add,
					remove: remove
				}, speed, easing, callback );
			}
		} );

	} )();

	/******************************************************************************/
	/*********************************** EFFECTS **********************************/
	/******************************************************************************/

	( function() {

		if ( $.expr && $.expr.pseudos && $.expr.pseudos.animated ) {
			$.expr.pseudos.animated = ( function( orig ) {
				return function( elem ) {
					return !!$( elem ).data( dataSpaceAnimated ) || orig( elem );
				};
			} )( $.expr.pseudos.animated );
		}

		if ( $.uiBackCompat !== false ) {
			$.extend( $.effects, {

				// Saves a set of properties in a data storage
				save: function( element, set ) {
					var i = 0, length = set.length;
					for ( ; i < length; i++ ) {
						if ( set[ i ] !== null ) {
							element.data( dataSpace + set[ i ], element[ 0 ].style[ set[ i ] ] );
						}
					}
				},

				// Restores a set of previously saved properties from a data storage
				restore: function( element, set ) {
					var val, i = 0, length = set.length;
					for ( ; i < length; i++ ) {
						if ( set[ i ] !== null ) {
							val = element.data( dataSpace + set[ i ] );
							element.css( set[ i ], val );
						}
					}
				},

				setMode: function( el, mode ) {
					if ( mode === "toggle" ) {
						mode = el.is( ":hidden" ) ? "show" : "hide";
					}
					return mode;
				},

				// Wraps the element around a wrapper that copies position properties
				createWrapper: function( element ) {

					// If the element is already wrapped, return it
					if ( element.parent().is( ".ui-effects-wrapper" ) ) {
						return element.parent();
					}

					// Wrap the element
					var props = {
							width: element.outerWidth( true ),
							height: element.outerHeight( true ),
							"float": element.css( "float" )
						},
						wrapper = $( "<div></div>" )
						.addClass( "ui-effects-wrapper" )
						.css( {
							fontSize: "100%",
							background: "transparent",
							border: "none",
							margin: 0,
							padding: 0
						} ),

						// Store the size in case width/height are defined in % - Fixes #5245
						size = {
							width: element.width(),
							height: element.height()
						},
						active = document.activeElement;

					// Support: Firefox
					// Firefox incorrectly exposes anonymous content
					// https://bugzilla.mozilla.org/show_bug.cgi?id=561664
					try {
						// eslint-disable-next-line no-unused-expressions
						active.id;
					} catch ( e ) {
						active = document.body;
					}

					element.wrap( wrapper );

					// Fixes #7595 - Elements lose focus when wrapped.
					if ( element[ 0 ] === active || $.contains( element[ 0 ], active ) ) {
						$( active ).trigger( "focus" );
					}

					// Hotfix for jQuery 1.4 since some change in wrap() seems to actually
					// lose the reference to the wrapped element
					wrapper = element.parent();

					// Transfer positioning properties to the wrapper
					if ( element.css( "position" ) === "static" ) {
						wrapper.css( { position: "relative" } );
						element.css( { position: "relative" } );
					} else {
						$.extend( props, {
							position: element.css( "position" ),
							zIndex: element.css( "z-index" )
						} );
						$.each( [ "top", "left", "bottom", "right" ], function( i, pos ) {
							props[ pos ] = element.css( pos );
							if ( isNaN( parseInt( props[ pos ], 10 ) ) ) {
								props[ pos ] = "auto";
							}
						} );
						element.css( {
							position: "relative",
							top: 0,
							left: 0,
							right: "auto",
							bottom: "auto"
						} );
					}
					element.css( size );

					return wrapper.css( props ).show();
				},

				removeWrapper: function( element ) {
					var active = document.activeElement;

					if ( element.parent().is( ".ui-effects-wrapper" ) ) {
						element.parent().replaceWith( element );

						// Fixes #7595 - Elements lose focus when wrapped.
						if ( element[ 0 ] === active || $.contains( element[ 0 ], active ) ) {
							$( active ).trigger( "focus" );
						}
					}

					return element;
				}
			} );
		}

		$.extend( $.effects, {
			version: "1.13.0",

			define: function( name, mode, effect ) {
				if ( !effect ) {
					effect = mode;
					mode = "effect";
				}

				$.effects.effect[ name ] = effect;
				$.effects.effect[ name ].mode = mode;

				return effect;
			},

			scaledDimensions: function( element, percent, direction ) {
				if ( percent === 0 ) {
					return {
						height: 0,
						width: 0,
						outerHeight: 0,
						outerWidth: 0
					};
				}

				var x = direction !== "horizontal" ? ( ( percent || 100 ) / 100 ) : 1,
					y = direction !== "vertical" ? ( ( percent || 100 ) / 100 ) : 1;

				return {
					height: element.height() * y,
					width: element.width() * x,
					outerHeight: element.outerHeight() * y,
					outerWidth: element.outerWidth() * x
				};

			},

			clipToBox: function( animation ) {
				return {
					width: animation.clip.right - animation.clip.left,
					height: animation.clip.bottom - animation.clip.top,
					left: animation.clip.left,
					top: animation.clip.top
				};
			},

			// Injects recently queued functions to be first in line (after "inprogress")
			unshift: function( element, queueLength, count ) {
				var queue = element.queue();

				if ( queueLength > 1 ) {
					queue.splice.apply( queue,
						[ 1, 0 ].concat( queue.splice( queueLength, count ) ) );
				}
				element.dequeue();
			},

			saveStyle: function( element ) {
				element.data( dataSpaceStyle, element[ 0 ].style.cssText );
			},

			restoreStyle: function( element ) {
				element[ 0 ].style.cssText = element.data( dataSpaceStyle ) || "";
				element.removeData( dataSpaceStyle );
			},

			mode: function( element, mode ) {
				var hidden = element.is( ":hidden" );

				if ( mode === "toggle" ) {
					mode = hidden ? "show" : "hide";
				}
				if ( hidden ? mode === "hide" : mode === "show" ) {
					mode = "none";
				}
				return mode;
			},

			// Translates a [top,left] array into a baseline value
			getBaseline: function( origin, original ) {
				var y, x;

				switch ( origin[ 0 ] ) {
					case "top":
						y = 0;
						break;
					case "middle":
						y = 0.5;
						break;
					case "bottom":
						y = 1;
						break;
					default:
						y = origin[ 0 ] / original.height;
				}

				switch ( origin[ 1 ] ) {
					case "left":
						x = 0;
						break;
					case "center":
						x = 0.5;
						break;
					case "right":
						x = 1;
						break;
					default:
						x = origin[ 1 ] / original.width;
				}

				return {
					x: x,
					y: y
				};
			},

			// Creates a placeholder element so that the original element can be made absolute
			createPlaceholder: function( element ) {
				var placeholder,
					cssPosition = element.css( "position" ),
					position = element.position();

				// Lock in margins first to account for form elements, which
				// will change margin if you explicitly set height
				// see: http://jsfiddle.net/JZSMt/3/ https://bugs.webkit.org/show_bug.cgi?id=107380
				// Support: Safari
				element.css( {
					marginTop: element.css( "marginTop" ),
					marginBottom: element.css( "marginBottom" ),
					marginLeft: element.css( "marginLeft" ),
					marginRight: element.css( "marginRight" )
				} )
				.outerWidth( element.outerWidth() )
				.outerHeight( element.outerHeight() );

				if ( /^(static|relative)/.test( cssPosition ) ) {
					cssPosition = "absolute";

					placeholder = $( "<" + element[ 0 ].nodeName + ">" ).insertAfter( element ).css( {

						// Convert inline to inline block to account for inline elements
						// that turn to inline block based on content (like img)
						display: /^(inline|ruby)/.test( element.css( "display" ) ) ?
							"inline-block" :
							"block",
						visibility: "hidden",

						// Margins need to be set to account for margin collapse
						marginTop: element.css( "marginTop" ),
						marginBottom: element.css( "marginBottom" ),
						marginLeft: element.css( "marginLeft" ),
						marginRight: element.css( "marginRight" ),
						"float": element.css( "float" )
					} )
					.outerWidth( element.outerWidth() )
					.outerHeight( element.outerHeight() )
					.addClass( "ui-effects-placeholder" );

					element.data( dataSpace + "placeholder", placeholder );
				}

				element.css( {
					position: cssPosition,
					left: position.left,
					top: position.top
				} );

				return placeholder;
			},

			removePlaceholder: function( element ) {
				var dataKey = dataSpace + "placeholder",
					placeholder = element.data( dataKey );

				if ( placeholder ) {
					placeholder.remove();
					element.removeData( dataKey );
				}
			},

			// Removes a placeholder if it exists and restores
			// properties that were modified during placeholder creation
			cleanUp: function( element ) {
				$.effects.restoreStyle( element );
				$.effects.removePlaceholder( element );
			},

			setTransition: function( element, list, factor, value ) {
				value = value || {};
				$.each( list, function( i, x ) {
					var unit = element.cssUnit( x );
					if ( unit[ 0 ] > 0 ) {
						value[ x ] = unit[ 0 ] * factor + unit[ 1 ];
					}
				} );
				return value;
			}
		} );

// Return an effect options object for the given parameters:
		function _normalizeArguments( effect, options, speed, callback ) {

			// Allow passing all options as the first parameter
			if ( $.isPlainObject( effect ) ) {
				options = effect;
				effect = effect.effect;
			}

			// Convert to an object
			effect = { effect: effect };

			// Catch (effect, null, ...)
			if ( options == null ) {
				options = {};
			}

			// Catch (effect, callback)
			if ( typeof options === "function" ) {
				callback = options;
				speed = null;
				options = {};
			}

			// Catch (effect, speed, ?)
			if ( typeof options === "number" || $.fx.speeds[ options ] ) {
				callback = speed;
				speed = options;
				options = {};
			}

			// Catch (effect, options, callback)
			if ( typeof speed === "function" ) {
				callback = speed;
				speed = null;
			}

			// Add options to effect
			if ( options ) {
				$.extend( effect, options );
			}

			speed = speed || options.duration;
			effect.duration = $.fx.off ? 0 :
				typeof speed === "number" ? speed :
					speed in $.fx.speeds ? $.fx.speeds[ speed ] :
						$.fx.speeds._default;

			effect.complete = callback || options.complete;

			return effect;
		}

		function standardAnimationOption( option ) {

			// Valid standard speeds (nothing, number, named speed)
			if ( !option || typeof option === "number" || $.fx.speeds[ option ] ) {
				return true;
			}

			// Invalid strings - treat as "normal" speed
			if ( typeof option === "string" && !$.effects.effect[ option ] ) {
				return true;
			}

			// Complete callback
			if ( typeof option === "function" ) {
				return true;
			}

			// Options hash (but not naming an effect)
			if ( typeof option === "object" && !option.effect ) {
				return true;
			}

			// Didn't match any standard API
			return false;
		}

		$.fn.extend( {
			effect: function( /* effect, options, speed, callback */ ) {
				var args = _normalizeArguments.apply( this, arguments ),
					effectMethod = $.effects.effect[ args.effect ],
					defaultMode = effectMethod.mode,
					queue = args.queue,
					queueName = queue || "fx",
					complete = args.complete,
					mode = args.mode,
					modes = [],
					prefilter = function( next ) {
						var el = $( this ),
							normalizedMode = $.effects.mode( el, mode ) || defaultMode;

						// Sentinel for duck-punching the :animated pseudo-selector
						el.data( dataSpaceAnimated, true );

						// Save effect mode for later use,
						// we can't just call $.effects.mode again later,
						// as the .show() below destroys the initial state
						modes.push( normalizedMode );

						// See $.uiBackCompat inside of run() for removal of defaultMode in 1.14
						if ( defaultMode && ( normalizedMode === "show" ||
							( normalizedMode === defaultMode && normalizedMode === "hide" ) ) ) {
							el.show();
						}

						if ( !defaultMode || normalizedMode !== "none" ) {
							$.effects.saveStyle( el );
						}

						if ( typeof next === "function" ) {
							next();
						}
					};

				if ( $.fx.off || !effectMethod ) {

					// Delegate to the original method (e.g., .show()) if possible
					if ( mode ) {
						return this[ mode ]( args.duration, complete );
					} else {
						return this.each( function() {
							if ( complete ) {
								complete.call( this );
							}
						} );
					}
				}

				function run( next ) {
					var elem = $( this );

					function cleanup() {
						elem.removeData( dataSpaceAnimated );

						$.effects.cleanUp( elem );

						if ( args.mode === "hide" ) {
							elem.hide();
						}

						done();
					}

					function done() {
						if ( typeof complete === "function" ) {
							complete.call( elem[ 0 ] );
						}

						if ( typeof next === "function" ) {
							next();
						}
					}

					// Override mode option on a per element basis,
					// as toggle can be either show or hide depending on element state
					args.mode = modes.shift();

					if ( $.uiBackCompat !== false && !defaultMode ) {
						if ( elem.is( ":hidden" ) ? mode === "hide" : mode === "show" ) {

							// Call the core method to track "olddisplay" properly
							elem[ mode ]();
							done();
						} else {
							effectMethod.call( elem[ 0 ], args, done );
						}
					} else {
						if ( args.mode === "none" ) {

							// Call the core method to track "olddisplay" properly
							elem[ mode ]();
							done();
						} else {
							effectMethod.call( elem[ 0 ], args, cleanup );
						}
					}
				}

				// Run prefilter on all elements first to ensure that
				// any showing or hiding happens before placeholder creation,
				// which ensures that any layout changes are correctly captured.
				return queue === false ?
					this.each( prefilter ).each( run ) :
					this.queue( queueName, prefilter ).queue( queueName, run );
			},

			show: ( function( orig ) {
				return function( option ) {
					if ( standardAnimationOption( option ) ) {
						return orig.apply( this, arguments );
					} else {
						var args = _normalizeArguments.apply( this, arguments );
						args.mode = "show";
						return this.effect.call( this, args );
					}
				};
			} )( $.fn.show ),

			hide: ( function( orig ) {
				return function( option ) {
					if ( standardAnimationOption( option ) ) {
						return orig.apply( this, arguments );
					} else {
						var args = _normalizeArguments.apply( this, arguments );
						args.mode = "hide";
						return this.effect.call( this, args );
					}
				};
			} )( $.fn.hide ),

			toggle: ( function( orig ) {
				return function( option ) {
					if ( standardAnimationOption( option ) || typeof option === "boolean" ) {
						return orig.apply( this, arguments );
					} else {
						var args = _normalizeArguments.apply( this, arguments );
						args.mode = "toggle";
						return this.effect.call( this, args );
					}
				};
			} )( $.fn.toggle ),

			cssUnit: function( key ) {
				var style = this.css( key ),
					val = [];

				$.each( [ "em", "px", "%", "pt" ], function( i, unit ) {
					if ( style.indexOf( unit ) > 0 ) {
						val = [ parseFloat( style ), unit ];
					}
				} );
				return val;
			},

			cssClip: function( clipObj ) {
				if ( clipObj ) {
					return this.css( "clip", "rect(" + clipObj.top + "px " + clipObj.right + "px " +
						clipObj.bottom + "px " + clipObj.left + "px)" );
				}
				return parseClip( this.css( "clip" ), this );
			},

			transfer: function( options, done ) {
				var element = $( this ),
					target = $( options.to ),
					targetFixed = target.css( "position" ) === "fixed",
					body = $( "body" ),
					fixTop = targetFixed ? body.scrollTop() : 0,
					fixLeft = targetFixed ? body.scrollLeft() : 0,
					endPosition = target.offset(),
					animation = {
						top: endPosition.top - fixTop,
						left: endPosition.left - fixLeft,
						height: target.innerHeight(),
						width: target.innerWidth()
					},
					startPosition = element.offset(),
					transfer = $( "<div class='ui-effects-transfer'></div>" );

				transfer
				.appendTo( "body" )
				.addClass( options.className )
				.css( {
					top: startPosition.top - fixTop,
					left: startPosition.left - fixLeft,
					height: element.innerHeight(),
					width: element.innerWidth(),
					position: targetFixed ? "fixed" : "absolute"
				} )
				.animate( animation, options.duration, options.easing, function() {
					transfer.remove();
					if ( typeof done === "function" ) {
						done();
					}
				} );
			}
		} );

		function parseClip( str, element ) {
			var outerWidth = element.outerWidth(),
				outerHeight = element.outerHeight(),
				clipRegex = /^rect\((-?\d*\.?\d*px|-?\d+%|auto),?\s*(-?\d*\.?\d*px|-?\d+%|auto),?\s*(-?\d*\.?\d*px|-?\d+%|auto),?\s*(-?\d*\.?\d*px|-?\d+%|auto)\)$/,
				values = clipRegex.exec( str ) || [ "", 0, outerWidth, outerHeight, 0 ];

			return {
				top: parseFloat( values[ 1 ] ) || 0,
				right: values[ 2 ] === "auto" ? outerWidth : parseFloat( values[ 2 ] ),
				bottom: values[ 3 ] === "auto" ? outerHeight : parseFloat( values[ 3 ] ),
				left: parseFloat( values[ 4 ] ) || 0
			};
		}

		$.fx.step.clip = function( fx ) {
			if ( !fx.clipInit ) {
				fx.start = $( fx.elem ).cssClip();
				if ( typeof fx.end === "string" ) {
					fx.end = parseClip( fx.end, fx.elem );
				}
				fx.clipInit = true;
			}

			$( fx.elem ).cssClip( {
				top: fx.pos * ( fx.end.top - fx.start.top ) + fx.start.top,
				right: fx.pos * ( fx.end.right - fx.start.right ) + fx.start.right,
				bottom: fx.pos * ( fx.end.bottom - fx.start.bottom ) + fx.start.bottom,
				left: fx.pos * ( fx.end.left - fx.start.left ) + fx.start.left
			} );
		};

	} )();

	/******************************************************************************/
	/*********************************** EASING ***********************************/
	/******************************************************************************/

	( function() {

// Based on easing equations from Robert Penner (http://www.robertpenner.com/easing)

		var baseEasings = {};

		$.each( [ "Quad", "Cubic", "Quart", "Quint", "Expo" ], function( i, name ) {
			baseEasings[ name ] = function( p ) {
				return Math.pow( p, i + 2 );
			};
		} );

		$.extend( baseEasings, {
			Sine: function( p ) {
				return 1 - Math.cos( p * Math.PI / 2 );
			},
			Circ: function( p ) {
				return 1 - Math.sqrt( 1 - p * p );
			},
			Elastic: function( p ) {
				return p === 0 || p === 1 ? p :
					-Math.pow( 2, 8 * ( p - 1 ) ) * Math.sin( ( ( p - 1 ) * 80 - 7.5 ) * Math.PI / 15 );
			},
			Back: function( p ) {
				return p * p * ( 3 * p - 2 );
			},
			Bounce: function( p ) {
				var pow2,
					bounce = 4;

				while ( p < ( ( pow2 = Math.pow( 2, --bounce ) ) - 1 ) / 11 ) {}
				return 1 / Math.pow( 4, 3 - bounce ) - 7.5625 * Math.pow( ( pow2 * 3 - 2 ) / 22 - p, 2 );
			}
		} );

		$.each( baseEasings, function( name, easeIn ) {
			$.easing[ "easeIn" + name ] = easeIn;
			$.easing[ "easeOut" + name ] = function( p ) {
				return 1 - easeIn( 1 - p );
			};
			$.easing[ "easeInOut" + name ] = function( p ) {
				return p < 0.5 ?
					easeIn( p * 2 ) / 2 :
					1 - easeIn( p * -2 + 2 ) / 2;
			};
		} );

	} )();

	var effect = $.effects;


	/*!
 * jQuery UI Effects Blind 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Blind Effect
//>>group: Effects
//>>description: Blinds the element.
//>>docs: http://api.jqueryui.com/blind-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectBlind = $.effects.define( "blind", "hide", function( options, done ) {
		var map = {
				up: [ "bottom", "top" ],
				vertical: [ "bottom", "top" ],
				down: [ "top", "bottom" ],
				left: [ "right", "left" ],
				horizontal: [ "right", "left" ],
				right: [ "left", "right" ]
			},
			element = $( this ),
			direction = options.direction || "up",
			start = element.cssClip(),
			animate = { clip: $.extend( {}, start ) },
			placeholder = $.effects.createPlaceholder( element );

		animate.clip[ map[ direction ][ 0 ] ] = animate.clip[ map[ direction ][ 1 ] ];

		if ( options.mode === "show" ) {
			element.cssClip( animate.clip );
			if ( placeholder ) {
				placeholder.css( $.effects.clipToBox( animate ) );
			}

			animate.clip = start;
		}

		if ( placeholder ) {
			placeholder.animate( $.effects.clipToBox( animate ), options.duration, options.easing );
		}

		element.animate( animate, {
			queue: false,
			duration: options.duration,
			easing: options.easing,
			complete: done
		} );
	} );


	/*!
 * jQuery UI Effects Bounce 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Bounce Effect
//>>group: Effects
//>>description: Bounces an element horizontally or vertically n times.
//>>docs: http://api.jqueryui.com/bounce-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectBounce = $.effects.define( "bounce", function( options, done ) {
		var upAnim, downAnim, refValue,
			element = $( this ),

			// Defaults:
			mode = options.mode,
			hide = mode === "hide",
			show = mode === "show",
			direction = options.direction || "up",
			distance = options.distance,
			times = options.times || 5,

			// Number of internal animations
			anims = times * 2 + ( show || hide ? 1 : 0 ),
			speed = options.duration / anims,
			easing = options.easing,

			// Utility:
			ref = ( direction === "up" || direction === "down" ) ? "top" : "left",
			motion = ( direction === "up" || direction === "left" ),
			i = 0,

			queuelen = element.queue().length;

		$.effects.createPlaceholder( element );

		refValue = element.css( ref );

		// Default distance for the BIGGEST bounce is the outer Distance / 3
		if ( !distance ) {
			distance = element[ ref === "top" ? "outerHeight" : "outerWidth" ]() / 3;
		}

		if ( show ) {
			downAnim = { opacity: 1 };
			downAnim[ ref ] = refValue;

			// If we are showing, force opacity 0 and set the initial position
			// then do the "first" animation
			element
			.css( "opacity", 0 )
			.css( ref, motion ? -distance * 2 : distance * 2 )
			.animate( downAnim, speed, easing );
		}

		// Start at the smallest distance if we are hiding
		if ( hide ) {
			distance = distance / Math.pow( 2, times - 1 );
		}

		downAnim = {};
		downAnim[ ref ] = refValue;

		// Bounces up/down/left/right then back to 0 -- times * 2 animations happen here
		for ( ; i < times; i++ ) {
			upAnim = {};
			upAnim[ ref ] = ( motion ? "-=" : "+=" ) + distance;

			element
			.animate( upAnim, speed, easing )
			.animate( downAnim, speed, easing );

			distance = hide ? distance * 2 : distance / 2;
		}

		// Last Bounce when Hiding
		if ( hide ) {
			upAnim = { opacity: 0 };
			upAnim[ ref ] = ( motion ? "-=" : "+=" ) + distance;

			element.animate( upAnim, speed, easing );
		}

		element.queue( done );

		$.effects.unshift( element, queuelen, anims + 1 );
	} );


	/*!
 * jQuery UI Effects Clip 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Clip Effect
//>>group: Effects
//>>description: Clips the element on and off like an old TV.
//>>docs: http://api.jqueryui.com/clip-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectClip = $.effects.define( "clip", "hide", function( options, done ) {
		var start,
			animate = {},
			element = $( this ),
			direction = options.direction || "vertical",
			both = direction === "both",
			horizontal = both || direction === "horizontal",
			vertical = both || direction === "vertical";

		start = element.cssClip();
		animate.clip = {
			top: vertical ? ( start.bottom - start.top ) / 2 : start.top,
			right: horizontal ? ( start.right - start.left ) / 2 : start.right,
			bottom: vertical ? ( start.bottom - start.top ) / 2 : start.bottom,
			left: horizontal ? ( start.right - start.left ) / 2 : start.left
		};

		$.effects.createPlaceholder( element );

		if ( options.mode === "show" ) {
			element.cssClip( animate.clip );
			animate.clip = start;
		}

		element.animate( animate, {
			queue: false,
			duration: options.duration,
			easing: options.easing,
			complete: done
		} );

	} );


	/*!
 * jQuery UI Effects Drop 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Drop Effect
//>>group: Effects
//>>description: Moves an element in one direction and hides it at the same time.
//>>docs: http://api.jqueryui.com/drop-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectDrop = $.effects.define( "drop", "hide", function( options, done ) {

		var distance,
			element = $( this ),
			mode = options.mode,
			show = mode === "show",
			direction = options.direction || "left",
			ref = ( direction === "up" || direction === "down" ) ? "top" : "left",
			motion = ( direction === "up" || direction === "left" ) ? "-=" : "+=",
			oppositeMotion = ( motion === "+=" ) ? "-=" : "+=",
			animation = {
				opacity: 0
			};

		$.effects.createPlaceholder( element );

		distance = options.distance ||
			element[ ref === "top" ? "outerHeight" : "outerWidth" ]( true ) / 2;

		animation[ ref ] = motion + distance;

		if ( show ) {
			element.css( animation );

			animation[ ref ] = oppositeMotion + distance;
			animation.opacity = 1;
		}

		// Animate
		element.animate( animation, {
			queue: false,
			duration: options.duration,
			easing: options.easing,
			complete: done
		} );
	} );


	/*!
 * jQuery UI Effects Explode 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Explode Effect
//>>group: Effects
	/* eslint-disable max-len */
//>>description: Explodes an element in all directions into n pieces. Implodes an element to its original wholeness.
	/* eslint-enable max-len */
//>>docs: http://api.jqueryui.com/explode-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectExplode = $.effects.define( "explode", "hide", function( options, done ) {

		var i, j, left, top, mx, my,
			rows = options.pieces ? Math.round( Math.sqrt( options.pieces ) ) : 3,
			cells = rows,
			element = $( this ),
			mode = options.mode,
			show = mode === "show",

			// Show and then visibility:hidden the element before calculating offset
			offset = element.show().css( "visibility", "hidden" ).offset(),

			// Width and height of a piece
			width = Math.ceil( element.outerWidth() / cells ),
			height = Math.ceil( element.outerHeight() / rows ),
			pieces = [];

		// Children animate complete:
		function childComplete() {
			pieces.push( this );
			if ( pieces.length === rows * cells ) {
				animComplete();
			}
		}

		// Clone the element for each row and cell.
		for ( i = 0; i < rows; i++ ) { // ===>
			top = offset.top + i * height;
			my = i - ( rows - 1 ) / 2;

			for ( j = 0; j < cells; j++ ) { // |||
				left = offset.left + j * width;
				mx = j - ( cells - 1 ) / 2;

				// Create a clone of the now hidden main element that will be absolute positioned
				// within a wrapper div off the -left and -top equal to size of our pieces
				element
				.clone()
				.appendTo( "body" )
				.wrap( "<div></div>" )
				.css( {
					position: "absolute",
					visibility: "visible",
					left: -j * width,
					top: -i * height
				} )

				// Select the wrapper - make it overflow: hidden and absolute positioned based on
				// where the original was located +left and +top equal to the size of pieces
				.parent()
				.addClass( "ui-effects-explode" )
				.css( {
					position: "absolute",
					overflow: "hidden",
					width: width,
					height: height,
					left: left + ( show ? mx * width : 0 ),
					top: top + ( show ? my * height : 0 ),
					opacity: show ? 0 : 1
				} )
				.animate( {
					left: left + ( show ? 0 : mx * width ),
					top: top + ( show ? 0 : my * height ),
					opacity: show ? 1 : 0
				}, options.duration || 500, options.easing, childComplete );
			}
		}

		function animComplete() {
			element.css( {
				visibility: "visible"
			} );
			$( pieces ).remove();
			done();
		}
	} );


	/*!
 * jQuery UI Effects Fade 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Fade Effect
//>>group: Effects
//>>description: Fades the element.
//>>docs: http://api.jqueryui.com/fade-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectFade = $.effects.define( "fade", "toggle", function( options, done ) {
		var show = options.mode === "show";

		$( this )
		.css( "opacity", show ? 0 : 1 )
		.animate( {
			opacity: show ? 1 : 0
		}, {
			queue: false,
			duration: options.duration,
			easing: options.easing,
			complete: done
		} );
	} );


	/*!
 * jQuery UI Effects Fold 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Fold Effect
//>>group: Effects
//>>description: Folds an element first horizontally and then vertically.
//>>docs: http://api.jqueryui.com/fold-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectFold = $.effects.define( "fold", "hide", function( options, done ) {

		// Create element
		var element = $( this ),
			mode = options.mode,
			show = mode === "show",
			hide = mode === "hide",
			size = options.size || 15,
			percent = /([0-9]+)%/.exec( size ),
			horizFirst = !!options.horizFirst,
			ref = horizFirst ? [ "right", "bottom" ] : [ "bottom", "right" ],
			duration = options.duration / 2,

			placeholder = $.effects.createPlaceholder( element ),

			start = element.cssClip(),
			animation1 = { clip: $.extend( {}, start ) },
			animation2 = { clip: $.extend( {}, start ) },

			distance = [ start[ ref[ 0 ] ], start[ ref[ 1 ] ] ],

			queuelen = element.queue().length;

		if ( percent ) {
			size = parseInt( percent[ 1 ], 10 ) / 100 * distance[ hide ? 0 : 1 ];
		}
		animation1.clip[ ref[ 0 ] ] = size;
		animation2.clip[ ref[ 0 ] ] = size;
		animation2.clip[ ref[ 1 ] ] = 0;

		if ( show ) {
			element.cssClip( animation2.clip );
			if ( placeholder ) {
				placeholder.css( $.effects.clipToBox( animation2 ) );
			}

			animation2.clip = start;
		}

		// Animate
		element
		.queue( function( next ) {
			if ( placeholder ) {
				placeholder
				.animate( $.effects.clipToBox( animation1 ), duration, options.easing )
				.animate( $.effects.clipToBox( animation2 ), duration, options.easing );
			}

			next();
		} )
		.animate( animation1, duration, options.easing )
		.animate( animation2, duration, options.easing )
		.queue( done );

		$.effects.unshift( element, queuelen, 4 );
	} );


	/*!
 * jQuery UI Effects Highlight 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Highlight Effect
//>>group: Effects
//>>description: Highlights the background of an element in a defined color for a custom duration.
//>>docs: http://api.jqueryui.com/highlight-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectHighlight = $.effects.define( "highlight", "show", function( options, done ) {
		var element = $( this ),
			animation = {
				backgroundColor: element.css( "backgroundColor" )
			};

		if ( options.mode === "hide" ) {
			animation.opacity = 0;
		}

		$.effects.saveStyle( element );

		element
		.css( {
			backgroundImage: "none",
			backgroundColor: options.color || "#ffff99"
		} )
		.animate( animation, {
			queue: false,
			duration: options.duration,
			easing: options.easing,
			complete: done
		} );
	} );


	/*!
 * jQuery UI Effects Size 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Size Effect
//>>group: Effects
//>>description: Resize an element to a specified width and height.
//>>docs: http://api.jqueryui.com/size-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectSize = $.effects.define( "size", function( options, done ) {

		// Create element
		var baseline, factor, temp,
			element = $( this ),

			// Copy for children
			cProps = [ "fontSize" ],
			vProps = [ "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom" ],
			hProps = [ "borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight" ],

			// Set options
			mode = options.mode,
			restore = mode !== "effect",
			scale = options.scale || "both",
			origin = options.origin || [ "middle", "center" ],
			position = element.css( "position" ),
			pos = element.position(),
			original = $.effects.scaledDimensions( element ),
			from = options.from || original,
			to = options.to || $.effects.scaledDimensions( element, 0 );

		$.effects.createPlaceholder( element );

		if ( mode === "show" ) {
			temp = from;
			from = to;
			to = temp;
		}

		// Set scaling factor
		factor = {
			from: {
				y: from.height / original.height,
				x: from.width / original.width
			},
			to: {
				y: to.height / original.height,
				x: to.width / original.width
			}
		};

		// Scale the css box
		if ( scale === "box" || scale === "both" ) {

			// Vertical props scaling
			if ( factor.from.y !== factor.to.y ) {
				from = $.effects.setTransition( element, vProps, factor.from.y, from );
				to = $.effects.setTransition( element, vProps, factor.to.y, to );
			}

			// Horizontal props scaling
			if ( factor.from.x !== factor.to.x ) {
				from = $.effects.setTransition( element, hProps, factor.from.x, from );
				to = $.effects.setTransition( element, hProps, factor.to.x, to );
			}
		}

		// Scale the content
		if ( scale === "content" || scale === "both" ) {

			// Vertical props scaling
			if ( factor.from.y !== factor.to.y ) {
				from = $.effects.setTransition( element, cProps, factor.from.y, from );
				to = $.effects.setTransition( element, cProps, factor.to.y, to );
			}
		}

		// Adjust the position properties based on the provided origin points
		if ( origin ) {
			baseline = $.effects.getBaseline( origin, original );
			from.top = ( original.outerHeight - from.outerHeight ) * baseline.y + pos.top;
			from.left = ( original.outerWidth - from.outerWidth ) * baseline.x + pos.left;
			to.top = ( original.outerHeight - to.outerHeight ) * baseline.y + pos.top;
			to.left = ( original.outerWidth - to.outerWidth ) * baseline.x + pos.left;
		}
		delete from.outerHeight;
		delete from.outerWidth;
		element.css( from );

		// Animate the children if desired
		if ( scale === "content" || scale === "both" ) {

			vProps = vProps.concat( [ "marginTop", "marginBottom" ] ).concat( cProps );
			hProps = hProps.concat( [ "marginLeft", "marginRight" ] );

			// Only animate children with width attributes specified
			// TODO: is this right? should we include anything with css width specified as well
			element.find( "*[width]" ).each( function() {
				var child = $( this ),
					childOriginal = $.effects.scaledDimensions( child ),
					childFrom = {
						height: childOriginal.height * factor.from.y,
						width: childOriginal.width * factor.from.x,
						outerHeight: childOriginal.outerHeight * factor.from.y,
						outerWidth: childOriginal.outerWidth * factor.from.x
					},
					childTo = {
						height: childOriginal.height * factor.to.y,
						width: childOriginal.width * factor.to.x,
						outerHeight: childOriginal.height * factor.to.y,
						outerWidth: childOriginal.width * factor.to.x
					};

				// Vertical props scaling
				if ( factor.from.y !== factor.to.y ) {
					childFrom = $.effects.setTransition( child, vProps, factor.from.y, childFrom );
					childTo = $.effects.setTransition( child, vProps, factor.to.y, childTo );
				}

				// Horizontal props scaling
				if ( factor.from.x !== factor.to.x ) {
					childFrom = $.effects.setTransition( child, hProps, factor.from.x, childFrom );
					childTo = $.effects.setTransition( child, hProps, factor.to.x, childTo );
				}

				if ( restore ) {
					$.effects.saveStyle( child );
				}

				// Animate children
				child.css( childFrom );
				child.animate( childTo, options.duration, options.easing, function() {

					// Restore children
					if ( restore ) {
						$.effects.restoreStyle( child );
					}
				} );
			} );
		}

		// Animate
		element.animate( to, {
			queue: false,
			duration: options.duration,
			easing: options.easing,
			complete: function() {

				var offset = element.offset();

				if ( to.opacity === 0 ) {
					element.css( "opacity", from.opacity );
				}

				if ( !restore ) {
					element
					.css( "position", position === "static" ? "relative" : position )
					.offset( offset );

					// Need to save style here so that automatic style restoration
					// doesn't restore to the original styles from before the animation.
					$.effects.saveStyle( element );
				}

				done();
			}
		} );

	} );


	/*!
 * jQuery UI Effects Scale 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Scale Effect
//>>group: Effects
//>>description: Grows or shrinks an element and its content.
//>>docs: http://api.jqueryui.com/scale-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectScale = $.effects.define( "scale", function( options, done ) {

		// Create element
		var el = $( this ),
			mode = options.mode,
			percent = parseInt( options.percent, 10 ) ||
				( parseInt( options.percent, 10 ) === 0 ? 0 : ( mode !== "effect" ? 0 : 100 ) ),

			newOptions = $.extend( true, {
				from: $.effects.scaledDimensions( el ),
				to: $.effects.scaledDimensions( el, percent, options.direction || "both" ),
				origin: options.origin || [ "middle", "center" ]
			}, options );

		// Fade option to support puff
		if ( options.fade ) {
			newOptions.from.opacity = 1;
			newOptions.to.opacity = 0;
		}

		$.effects.effect.size.call( this, newOptions, done );
	} );


	/*!
 * jQuery UI Effects Puff 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Puff Effect
//>>group: Effects
//>>description: Creates a puff effect by scaling the element up and hiding it at the same time.
//>>docs: http://api.jqueryui.com/puff-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectPuff = $.effects.define( "puff", "hide", function( options, done ) {
		var newOptions = $.extend( true, {}, options, {
			fade: true,
			percent: parseInt( options.percent, 10 ) || 150
		} );

		$.effects.effect.scale.call( this, newOptions, done );
	} );


	/*!
 * jQuery UI Effects Pulsate 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Pulsate Effect
//>>group: Effects
//>>description: Pulsates an element n times by changing the opacity to zero and back.
//>>docs: http://api.jqueryui.com/pulsate-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectPulsate = $.effects.define( "pulsate", "show", function( options, done ) {
		var element = $( this ),
			mode = options.mode,
			show = mode === "show",
			hide = mode === "hide",
			showhide = show || hide,

			// Showing or hiding leaves off the "last" animation
			anims = ( ( options.times || 5 ) * 2 ) + ( showhide ? 1 : 0 ),
			duration = options.duration / anims,
			animateTo = 0,
			i = 1,
			queuelen = element.queue().length;

		if ( show || !element.is( ":visible" ) ) {
			element.css( "opacity", 0 ).show();
			animateTo = 1;
		}

		// Anims - 1 opacity "toggles"
		for ( ; i < anims; i++ ) {
			element.animate( { opacity: animateTo }, duration, options.easing );
			animateTo = 1 - animateTo;
		}

		element.animate( { opacity: animateTo }, duration, options.easing );

		element.queue( done );

		$.effects.unshift( element, queuelen, anims + 1 );
	} );


	/*!
 * jQuery UI Effects Shake 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Shake Effect
//>>group: Effects
//>>description: Shakes an element horizontally or vertically n times.
//>>docs: http://api.jqueryui.com/shake-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectShake = $.effects.define( "shake", function( options, done ) {

		var i = 1,
			element = $( this ),
			direction = options.direction || "left",
			distance = options.distance || 20,
			times = options.times || 3,
			anims = times * 2 + 1,
			speed = Math.round( options.duration / anims ),
			ref = ( direction === "up" || direction === "down" ) ? "top" : "left",
			positiveMotion = ( direction === "up" || direction === "left" ),
			animation = {},
			animation1 = {},
			animation2 = {},

			queuelen = element.queue().length;

		$.effects.createPlaceholder( element );

		// Animation
		animation[ ref ] = ( positiveMotion ? "-=" : "+=" ) + distance;
		animation1[ ref ] = ( positiveMotion ? "+=" : "-=" ) + distance * 2;
		animation2[ ref ] = ( positiveMotion ? "-=" : "+=" ) + distance * 2;

		// Animate
		element.animate( animation, speed, options.easing );

		// Shakes
		for ( ; i < times; i++ ) {
			element
			.animate( animation1, speed, options.easing )
			.animate( animation2, speed, options.easing );
		}

		element
		.animate( animation1, speed, options.easing )
		.animate( animation, speed / 2, options.easing )
		.queue( done );

		$.effects.unshift( element, queuelen, anims + 1 );
	} );


	/*!
 * jQuery UI Effects Slide 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Slide Effect
//>>group: Effects
//>>description: Slides an element in and out of the viewport.
//>>docs: http://api.jqueryui.com/slide-effect/
//>>demos: http://jqueryui.com/effect/


	var effectsEffectSlide = $.effects.define( "slide", "show", function( options, done ) {
		var startClip, startRef,
			element = $( this ),
			map = {
				up: [ "bottom", "top" ],
				down: [ "top", "bottom" ],
				left: [ "right", "left" ],
				right: [ "left", "right" ]
			},
			mode = options.mode,
			direction = options.direction || "left",
			ref = ( direction === "up" || direction === "down" ) ? "top" : "left",
			positiveMotion = ( direction === "up" || direction === "left" ),
			distance = options.distance ||
				element[ ref === "top" ? "outerHeight" : "outerWidth" ]( true ),
			animation = {};

		$.effects.createPlaceholder( element );

		startClip = element.cssClip();
		startRef = element.position()[ ref ];

		// Define hide animation
		animation[ ref ] = ( positiveMotion ? -1 : 1 ) * distance + startRef;
		animation.clip = element.cssClip();
		animation.clip[ map[ direction ][ 1 ] ] = animation.clip[ map[ direction ][ 0 ] ];

		// Reverse the animation if we're showing
		if ( mode === "show" ) {
			element.cssClip( animation.clip );
			element.css( ref, animation[ ref ] );
			animation.clip = startClip;
			animation[ ref ] = startRef;
		}

		// Actually animate
		element.animate( animation, {
			queue: false,
			duration: options.duration,
			easing: options.easing,
			complete: done
		} );
	} );


	/*!
 * jQuery UI Effects Transfer 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Transfer Effect
//>>group: Effects
//>>description: Displays a transfer effect from one element to another.
//>>docs: http://api.jqueryui.com/transfer-effect/
//>>demos: http://jqueryui.com/effect/


	var effect;
	if ( $.uiBackCompat !== false ) {
		effect = $.effects.define( "transfer", function( options, done ) {
			$( this ).transfer( options, done );
		} );
	}
	var effectsEffectTransfer = effect;


	/*!
 * jQuery UI Focusable 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: :focusable Selector
//>>group: Core
//>>description: Selects elements which can be focused.
//>>docs: http://api.jqueryui.com/focusable-selector/


// Selectors
	$.ui.focusable = function( element, hasTabindex ) {
		var map, mapName, img, focusableIfVisible, fieldset,
			nodeName = element.nodeName.toLowerCase();

		if ( "area" === nodeName ) {
			map = element.parentNode;
			mapName = map.name;
			if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
				return false;
			}
			img = $( "img[usemap='#" + mapName + "']" );
			return img.length > 0 && img.is( ":visible" );
		}

		if ( /^(input|select|textarea|button|object)$/.test( nodeName ) ) {
			focusableIfVisible = !element.disabled;

			if ( focusableIfVisible ) {

				// Form controls within a disabled fieldset are disabled.
				// However, controls within the fieldset's legend do not get disabled.
				// Since controls generally aren't placed inside legends, we skip
				// this portion of the check.
				fieldset = $( element ).closest( "fieldset" )[ 0 ];
				if ( fieldset ) {
					focusableIfVisible = !fieldset.disabled;
				}
			}
		} else if ( "a" === nodeName ) {
			focusableIfVisible = element.href || hasTabindex;
		} else {
			focusableIfVisible = hasTabindex;
		}

		return focusableIfVisible && $( element ).is( ":visible" ) && visible( $( element ) );
	};

// Support: IE 8 only
// IE 8 doesn't resolve inherit to visible/hidden for computed values
	function visible( element ) {
		var visibility = element.css( "visibility" );
		while ( visibility === "inherit" ) {
			element = element.parent();
			visibility = element.css( "visibility" );
		}
		return visibility === "visible";
	}

	$.extend( $.expr.pseudos, {
		focusable: function( element ) {
			return $.ui.focusable( element, $.attr( element, "tabindex" ) != null );
		}
	} );

	var focusable = $.ui.focusable;



// Support: IE8 Only
// IE8 does not support the form attribute and when it is supplied. It overwrites the form prop
// with a string, so we need to find the proper form.
	var form = $.fn._form = function() {
		return typeof this[ 0 ].form === "string" ? this.closest( "form" ) : $( this[ 0 ].form );
	};


	/*!
 * jQuery UI Form Reset Mixin 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Form Reset Mixin
//>>group: Core
//>>description: Refresh input widgets when their form is reset
//>>docs: http://api.jqueryui.com/form-reset-mixin/


	var formResetMixin = $.ui.formResetMixin = {
		_formResetHandler: function() {
			var form = $( this );

			// Wait for the form reset to actually happen before refreshing
			setTimeout( function() {
				var instances = form.data( "ui-form-reset-instances" );
				$.each( instances, function() {
					this.refresh();
				} );
			} );
		},

		_bindFormResetHandler: function() {
			this.form = this.element._form();
			if ( !this.form.length ) {
				return;
			}

			var instances = this.form.data( "ui-form-reset-instances" ) || [];
			if ( !instances.length ) {

				// We don't use _on() here because we use a single event handler per form
				this.form.on( "reset.ui-form-reset", this._formResetHandler );
			}
			instances.push( this );
			this.form.data( "ui-form-reset-instances", instances );
		},

		_unbindFormResetHandler: function() {
			if ( !this.form.length ) {
				return;
			}

			var instances = this.form.data( "ui-form-reset-instances" );
			instances.splice( $.inArray( this, instances ), 1 );
			if ( instances.length ) {
				this.form.data( "ui-form-reset-instances", instances );
			} else {
				this.form
				.removeData( "ui-form-reset-instances" )
				.off( "reset.ui-form-reset" );
			}
		}
	};


	/*!
 * jQuery UI Support for jQuery core 1.8.x and newer 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 */

//>>label: jQuery 1.8+ Support
//>>group: Core
//>>description: Support version 1.8.x and newer of jQuery core


// Support: jQuery 1.9.x or older
// $.expr[ ":" ] is deprecated.
	if ( !$.expr.pseudos ) {
		$.expr.pseudos = $.expr[ ":" ];
	}

// Support: jQuery 1.11.x or older
// $.unique has been renamed to $.uniqueSort
	if ( !$.uniqueSort ) {
		$.uniqueSort = $.unique;
	}

// Support: jQuery 2.2.x or older.
// This method has been defined in jQuery 3.0.0.
// Code from https://github.com/jquery/jquery/blob/e539bac79e666bba95bba86d690b4e609dca2286/src/selector/escapeSelector.js
	if ( !$.escapeSelector ) {

		// CSS string/identifier serialization
		// https://drafts.csswg.org/cssom/#common-serializing-idioms
		var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;

		var fcssescape = function( ch, asCodePoint ) {
			if ( asCodePoint ) {

				// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
				if ( ch === "\0" ) {
					return "\uFFFD";
				}

				// Control characters and (dependent upon position) numbers get escaped as code points
				return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
			}

			// Other potentially-special ASCII characters get backslash-escaped
			return "\\" + ch;
		};

		$.escapeSelector = function( sel ) {
			return ( sel + "" ).replace( rcssescape, fcssescape );
		};
	}

// Support: jQuery 3.4.x or older
// These methods have been defined in jQuery 3.5.0.
	if ( !$.fn.even || !$.fn.odd ) {
		$.fn.extend( {
			even: function() {
				return this.filter( function( i ) {
					return i % 2 === 0;
				} );
			},
			odd: function() {
				return this.filter( function( i ) {
					return i % 2 === 1;
				} );
			}
		} );
	}

	;
	/*!
 * jQuery UI Keycode 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Keycode
//>>group: Core
//>>description: Provide keycodes as keynames
//>>docs: http://api.jqueryui.com/jQuery.ui.keyCode/


	var keycode = $.ui.keyCode = {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	};


	/*!
 * jQuery UI Labels 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: labels
//>>group: Core
//>>description: Find all the labels associated with a given input
//>>docs: http://api.jqueryui.com/labels/


	var labels = $.fn.labels = function() {
		var ancestor, selector, id, labels, ancestors;

		if ( !this.length ) {
			return this.pushStack( [] );
		}

		// Check control.labels first
		if ( this[ 0 ].labels && this[ 0 ].labels.length ) {
			return this.pushStack( this[ 0 ].labels );
		}

		// Support: IE <= 11, FF <= 37, Android <= 2.3 only
		// Above browsers do not support control.labels. Everything below is to support them
		// as well as document fragments. control.labels does not work on document fragments
		labels = this.eq( 0 ).parents( "label" );

		// Look for the label based on the id
		id = this.attr( "id" );
		if ( id ) {

			// We don't search against the document in case the element
			// is disconnected from the DOM
			ancestor = this.eq( 0 ).parents().last();

			// Get a full set of top level ancestors
			ancestors = ancestor.add( ancestor.length ? ancestor.siblings() : this.siblings() );

			// Create a selector for the label based on the id
			selector = "label[for='" + $.escapeSelector( id ) + "']";

			labels = labels.add( ancestors.find( selector ).addBack( selector ) );

		}

		// Return whatever we have found for labels
		return this.pushStack( labels );
	};


	/*!
 * jQuery UI Scroll Parent 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: scrollParent
//>>group: Core
//>>description: Get the closest ancestor element that is scrollable.
//>>docs: http://api.jqueryui.com/scrollParent/


	var scrollParent = $.fn.scrollParent = function( includeHidden ) {
		var position = this.css( "position" ),
			excludeStaticParent = position === "absolute",
			overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
			scrollParent = this.parents().filter( function() {
				var parent = $( this );
				if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
					return false;
				}
				return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
					parent.css( "overflow-x" ) );
			} ).eq( 0 );

		return position === "fixed" || !scrollParent.length ?
			$( this[ 0 ].ownerDocument || document ) :
			scrollParent;
	};


	/*!
 * jQuery UI Tabbable 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: :tabbable Selector
//>>group: Core
//>>description: Selects elements which can be tabbed to.
//>>docs: http://api.jqueryui.com/tabbable-selector/


	var tabbable = $.extend( $.expr.pseudos, {
		tabbable: function( element ) {
			var tabIndex = $.attr( element, "tabindex" ),
				hasTabindex = tabIndex != null;
			return ( !hasTabindex || tabIndex >= 0 ) && $.ui.focusable( element, hasTabindex );
		}
	} );


	/*!
 * jQuery UI Unique ID 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: uniqueId
//>>group: Core
//>>description: Functions to generate and remove uniqueId's
//>>docs: http://api.jqueryui.com/uniqueId/


	var uniqueId = $.fn.extend( {
		uniqueId: ( function() {
			var uuid = 0;

			return function() {
				return this.each( function() {
					if ( !this.id ) {
						this.id = "ui-id-" + ( ++uuid );
					}
				} );
			};
		} )(),

		removeUniqueId: function() {
			return this.each( function() {
				if ( /^ui-id-\d+$/.test( this.id ) ) {
					$( this ).removeAttr( "id" );
				}
			} );
		}
	} );


	/*!
 * jQuery UI Accordion 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Accordion
//>>group: Widgets
	/* eslint-disable max-len */
//>>description: Displays collapsible content panels for presenting information in a limited amount of space.
	/* eslint-enable max-len */
//>>docs: http://api.jqueryui.com/accordion/
//>>demos: http://jqueryui.com/accordion/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/accordion.css
//>>css.theme: ../../themes/base/theme.css


	var widgetsAccordion = $.widget( "ui.accordion", {
		version: "1.13.0",
		options: {
			active: 0,
			animate: {},
			classes: {
				"ui-accordion-header": "ui-corner-top",
				"ui-accordion-header-collapsed": "ui-corner-all",
				"ui-accordion-content": "ui-corner-bottom"
			},
			collapsible: false,
			event: "click",
			header: function( elem ) {
				return elem.find( "> li > :first-child" ).add( elem.find( "> :not(li)" ).even() );
			},
			heightStyle: "auto",
			icons: {
				activeHeader: "ui-icon-triangle-1-s",
				header: "ui-icon-triangle-1-e"
			},

			// Callbacks
			activate: null,
			beforeActivate: null
		},

		hideProps: {
			borderTopWidth: "hide",
			borderBottomWidth: "hide",
			paddingTop: "hide",
			paddingBottom: "hide",
			height: "hide"
		},

		showProps: {
			borderTopWidth: "show",
			borderBottomWidth: "show",
			paddingTop: "show",
			paddingBottom: "show",
			height: "show"
		},

		_create: function() {
			var options = this.options;

			this.prevShow = this.prevHide = $();
			this._addClass( "ui-accordion", "ui-widget ui-helper-reset" );
			this.element.attr( "role", "tablist" );

			// Don't allow collapsible: false and active: false / null
			if ( !options.collapsible && ( options.active === false || options.active == null ) ) {
				options.active = 0;
			}

			this._processPanels();

			// handle negative values
			if ( options.active < 0 ) {
				options.active += this.headers.length;
			}
			this._refresh();
		},

		_getCreateEventData: function() {
			return {
				header: this.active,
				panel: !this.active.length ? $() : this.active.next()
			};
		},

		_createIcons: function() {
			var icon, children,
				icons = this.options.icons;

			if ( icons ) {
				icon = $( "<span>" );
				this._addClass( icon, "ui-accordion-header-icon", "ui-icon " + icons.header );
				icon.prependTo( this.headers );
				children = this.active.children( ".ui-accordion-header-icon" );
				this._removeClass( children, icons.header )
				._addClass( children, null, icons.activeHeader )
				._addClass( this.headers, "ui-accordion-icons" );
			}
		},

		_destroyIcons: function() {
			this._removeClass( this.headers, "ui-accordion-icons" );
			this.headers.children( ".ui-accordion-header-icon" ).remove();
		},

		_destroy: function() {
			var contents;

			// Clean up main element
			this.element.removeAttr( "role" );

			// Clean up headers
			this.headers
			.removeAttr( "role aria-expanded aria-selected aria-controls tabIndex" )
			.removeUniqueId();

			this._destroyIcons();

			// Clean up content panels
			contents = this.headers.next()
			.css( "display", "" )
			.removeAttr( "role aria-hidden aria-labelledby" )
			.removeUniqueId();

			if ( this.options.heightStyle !== "content" ) {
				contents.css( "height", "" );
			}
		},

		_setOption: function( key, value ) {
			if ( key === "active" ) {

				// _activate() will handle invalid values and update this.options
				this._activate( value );
				return;
			}

			if ( key === "event" ) {
				if ( this.options.event ) {
					this._off( this.headers, this.options.event );
				}
				this._setupEvents( value );
			}

			this._super( key, value );

			// Setting collapsible: false while collapsed; open first panel
			if ( key === "collapsible" && !value && this.options.active === false ) {
				this._activate( 0 );
			}

			if ( key === "icons" ) {
				this._destroyIcons();
				if ( value ) {
					this._createIcons();
				}
			}
		},

		_setOptionDisabled: function( value ) {
			this._super( value );

			this.element.attr( "aria-disabled", value );

			// Support: IE8 Only
			// #5332 / #6059 - opacity doesn't cascade to positioned elements in IE
			// so we need to add the disabled class to the headers and panels
			this._toggleClass( null, "ui-state-disabled", !!value );
			this._toggleClass( this.headers.add( this.headers.next() ), null, "ui-state-disabled",
				!!value );
		},

		_keydown: function( event ) {
			if ( event.altKey || event.ctrlKey ) {
				return;
			}

			var keyCode = $.ui.keyCode,
				length = this.headers.length,
				currentIndex = this.headers.index( event.target ),
				toFocus = false;

			switch ( event.keyCode ) {
				case keyCode.RIGHT:
				case keyCode.DOWN:
					toFocus = this.headers[ ( currentIndex + 1 ) % length ];
					break;
				case keyCode.LEFT:
				case keyCode.UP:
					toFocus = this.headers[ ( currentIndex - 1 + length ) % length ];
					break;
				case keyCode.SPACE:
				case keyCode.ENTER:
					this._eventHandler( event );
					break;
				case keyCode.HOME:
					toFocus = this.headers[ 0 ];
					break;
				case keyCode.END:
					toFocus = this.headers[ length - 1 ];
					break;
			}

			if ( toFocus ) {
				$( event.target ).attr( "tabIndex", -1 );
				$( toFocus ).attr( "tabIndex", 0 );
				$( toFocus ).trigger( "focus" );
				event.preventDefault();
			}
		},

		_panelKeyDown: function( event ) {
			if ( event.keyCode === $.ui.keyCode.UP && event.ctrlKey ) {
				$( event.currentTarget ).prev().trigger( "focus" );
			}
		},

		refresh: function() {
			var options = this.options;
			this._processPanels();

			// Was collapsed or no panel
			if ( ( options.active === false && options.collapsible === true ) ||
				!this.headers.length ) {
				options.active = false;
				this.active = $();

				// active false only when collapsible is true
			} else if ( options.active === false ) {
				this._activate( 0 );

				// was active, but active panel is gone
			} else if ( this.active.length && !$.contains( this.element[ 0 ], this.active[ 0 ] ) ) {

				// all remaining panel are disabled
				if ( this.headers.length === this.headers.find( ".ui-state-disabled" ).length ) {
					options.active = false;
					this.active = $();

					// activate previous panel
				} else {
					this._activate( Math.max( 0, options.active - 1 ) );
				}

				// was active, active panel still exists
			} else {

				// make sure active index is correct
				options.active = this.headers.index( this.active );
			}

			this._destroyIcons();

			this._refresh();
		},

		_processPanels: function() {
			var prevHeaders = this.headers,
				prevPanels = this.panels;

			if ( typeof this.options.header === "function" ) {
				this.headers = this.options.header( this.element );
			} else {
				this.headers = this.element.find( this.options.header );
			}
			this._addClass( this.headers, "ui-accordion-header ui-accordion-header-collapsed",
				"ui-state-default" );

			this.panels = this.headers.next().filter( ":not(.ui-accordion-content-active)" ).hide();
			this._addClass( this.panels, "ui-accordion-content", "ui-helper-reset ui-widget-content" );

			// Avoid memory leaks (#10056)
			if ( prevPanels ) {
				this._off( prevHeaders.not( this.headers ) );
				this._off( prevPanels.not( this.panels ) );
			}
		},

		_refresh: function() {
			var maxHeight,
				options = this.options,
				heightStyle = options.heightStyle,
				parent = this.element.parent();

			this.active = this._findActive( options.active );
			this._addClass( this.active, "ui-accordion-header-active", "ui-state-active" )
			._removeClass( this.active, "ui-accordion-header-collapsed" );
			this._addClass( this.active.next(), "ui-accordion-content-active" );
			this.active.next().show();

			this.headers
			.attr( "role", "tab" )
			.each( function() {
				var header = $( this ),
					headerId = header.uniqueId().attr( "id" ),
					panel = header.next(),
					panelId = panel.uniqueId().attr( "id" );
				header.attr( "aria-controls", panelId );
				panel.attr( "aria-labelledby", headerId );
			} )
			.next()
			.attr( "role", "tabpanel" );

			this.headers
			.not( this.active )
			.attr( {
				"aria-selected": "false",
				"aria-expanded": "false",
				tabIndex: -1
			} )
			.next()
			.attr( {
				"aria-hidden": "true"
			} )
			.hide();

			// Make sure at least one header is in the tab order
			if ( !this.active.length ) {
				this.headers.eq( 0 ).attr( "tabIndex", 0 );
			} else {
				this.active.attr( {
					"aria-selected": "true",
					"aria-expanded": "true",
					tabIndex: 0
				} )
				.next()
				.attr( {
					"aria-hidden": "false"
				} );
			}

			this._createIcons();

			this._setupEvents( options.event );

			if ( heightStyle === "fill" ) {
				maxHeight = parent.height();
				this.element.siblings( ":visible" ).each( function() {
					var elem = $( this ),
						position = elem.css( "position" );

					if ( position === "absolute" || position === "fixed" ) {
						return;
					}
					maxHeight -= elem.outerHeight( true );
				} );

				this.headers.each( function() {
					maxHeight -= $( this ).outerHeight( true );
				} );

				this.headers.next()
				.each( function() {
					$( this ).height( Math.max( 0, maxHeight -
						$( this ).innerHeight() + $( this ).height() ) );
				} )
				.css( "overflow", "auto" );
			} else if ( heightStyle === "auto" ) {
				maxHeight = 0;
				this.headers.next()
				.each( function() {
					var isVisible = $( this ).is( ":visible" );
					if ( !isVisible ) {
						$( this ).show();
					}
					maxHeight = Math.max( maxHeight, $( this ).css( "height", "" ).height() );
					if ( !isVisible ) {
						$( this ).hide();
					}
				} )
				.height( maxHeight );
			}
		},

		_activate: function( index ) {
			var active = this._findActive( index )[ 0 ];

			// Trying to activate the already active panel
			if ( active === this.active[ 0 ] ) {
				return;
			}

			// Trying to collapse, simulate a click on the currently active header
			active = active || this.active[ 0 ];

			this._eventHandler( {
				target: active,
				currentTarget: active,
				preventDefault: $.noop
			} );
		},

		_findActive: function( selector ) {
			return typeof selector === "number" ? this.headers.eq( selector ) : $();
		},

		_setupEvents: function( event ) {
			var events = {
				keydown: "_keydown"
			};
			if ( event ) {
				$.each( event.split( " " ), function( index, eventName ) {
					events[ eventName ] = "_eventHandler";
				} );
			}

			this._off( this.headers.add( this.headers.next() ) );
			this._on( this.headers, events );
			this._on( this.headers.next(), { keydown: "_panelKeyDown" } );
			this._hoverable( this.headers );
			this._focusable( this.headers );
		},

		_eventHandler: function( event ) {
			var activeChildren, clickedChildren,
				options = this.options,
				active = this.active,
				clicked = $( event.currentTarget ),
				clickedIsActive = clicked[ 0 ] === active[ 0 ],
				collapsing = clickedIsActive && options.collapsible,
				toShow = collapsing ? $() : clicked.next(),
				toHide = active.next(),
				eventData = {
					oldHeader: active,
					oldPanel: toHide,
					newHeader: collapsing ? $() : clicked,
					newPanel: toShow
				};

			event.preventDefault();

			if (

				// click on active header, but not collapsible
				( clickedIsActive && !options.collapsible ) ||

				// allow canceling activation
				( this._trigger( "beforeActivate", event, eventData ) === false ) ) {
				return;
			}

			options.active = collapsing ? false : this.headers.index( clicked );

			// When the call to ._toggle() comes after the class changes
			// it causes a very odd bug in IE 8 (see #6720)
			this.active = clickedIsActive ? $() : clicked;
			this._toggle( eventData );

			// Switch classes
			// corner classes on the previously active header stay after the animation
			this._removeClass( active, "ui-accordion-header-active", "ui-state-active" );
			if ( options.icons ) {
				activeChildren = active.children( ".ui-accordion-header-icon" );
				this._removeClass( activeChildren, null, options.icons.activeHeader )
				._addClass( activeChildren, null, options.icons.header );
			}

			if ( !clickedIsActive ) {
				this._removeClass( clicked, "ui-accordion-header-collapsed" )
				._addClass( clicked, "ui-accordion-header-active", "ui-state-active" );
				if ( options.icons ) {
					clickedChildren = clicked.children( ".ui-accordion-header-icon" );
					this._removeClass( clickedChildren, null, options.icons.header )
					._addClass( clickedChildren, null, options.icons.activeHeader );
				}

				this._addClass( clicked.next(), "ui-accordion-content-active" );
			}
		},

		_toggle: function( data ) {
			var toShow = data.newPanel,
				toHide = this.prevShow.length ? this.prevShow : data.oldPanel;

			// Handle activating a panel during the animation for another activation
			this.prevShow.add( this.prevHide ).stop( true, true );
			this.prevShow = toShow;
			this.prevHide = toHide;

			if ( this.options.animate ) {
				this._animate( toShow, toHide, data );
			} else {
				toHide.hide();
				toShow.show();
				this._toggleComplete( data );
			}

			toHide.attr( {
				"aria-hidden": "true"
			} );
			toHide.prev().attr( {
				"aria-selected": "false",
				"aria-expanded": "false"
			} );

			// if we're switching panels, remove the old header from the tab order
			// if we're opening from collapsed state, remove the previous header from the tab order
			// if we're collapsing, then keep the collapsing header in the tab order
			if ( toShow.length && toHide.length ) {
				toHide.prev().attr( {
					"tabIndex": -1,
					"aria-expanded": "false"
				} );
			} else if ( toShow.length ) {
				this.headers.filter( function() {
					return parseInt( $( this ).attr( "tabIndex" ), 10 ) === 0;
				} )
				.attr( "tabIndex", -1 );
			}

			toShow
			.attr( "aria-hidden", "false" )
			.prev()
			.attr( {
				"aria-selected": "true",
				"aria-expanded": "true",
				tabIndex: 0
			} );
		},

		_animate: function( toShow, toHide, data ) {
			var total, easing, duration,
				that = this,
				adjust = 0,
				boxSizing = toShow.css( "box-sizing" ),
				down = toShow.length &&
					( !toHide.length || ( toShow.index() < toHide.index() ) ),
				animate = this.options.animate || {},
				options = down && animate.down || animate,
				complete = function() {
					that._toggleComplete( data );
				};

			if ( typeof options === "number" ) {
				duration = options;
			}
			if ( typeof options === "string" ) {
				easing = options;
			}

			// fall back from options to animation in case of partial down settings
			easing = easing || options.easing || animate.easing;
			duration = duration || options.duration || animate.duration;

			if ( !toHide.length ) {
				return toShow.animate( this.showProps, duration, easing, complete );
			}
			if ( !toShow.length ) {
				return toHide.animate( this.hideProps, duration, easing, complete );
			}

			total = toShow.show().outerHeight();
			toHide.animate( this.hideProps, {
				duration: duration,
				easing: easing,
				step: function( now, fx ) {
					fx.now = Math.round( now );
				}
			} );
			toShow
			.hide()
			.animate( this.showProps, {
				duration: duration,
				easing: easing,
				complete: complete,
				step: function( now, fx ) {
					fx.now = Math.round( now );
					if ( fx.prop !== "height" ) {
						if ( boxSizing === "content-box" ) {
							adjust += fx.now;
						}
					} else if ( that.options.heightStyle !== "content" ) {
						fx.now = Math.round( total - toHide.outerHeight() - adjust );
						adjust = 0;
					}
				}
			} );
		},

		_toggleComplete: function( data ) {
			var toHide = data.oldPanel,
				prev = toHide.prev();

			this._removeClass( toHide, "ui-accordion-content-active" );
			this._removeClass( prev, "ui-accordion-header-active" )
			._addClass( prev, "ui-accordion-header-collapsed" );

			// Work around for rendering bug in IE (#5421)
			if ( toHide.length ) {
				toHide.parent()[ 0 ].className = toHide.parent()[ 0 ].className;
			}
			this._trigger( "activate", null, data );
		}
	} );



	var safeActiveElement = $.ui.safeActiveElement = function( document ) {
		var activeElement;

		// Support: IE 9 only
		// IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
		try {
			activeElement = document.activeElement;
		} catch ( error ) {
			activeElement = document.body;
		}

		// Support: IE 9 - 11 only
		// IE may return null instead of an element
		// Interestingly, this only seems to occur when NOT in an iframe
		if ( !activeElement ) {
			activeElement = document.body;
		}

		// Support: IE 11 only
		// IE11 returns a seemingly empty object in some cases when accessing
		// document.activeElement from an <iframe>
		if ( !activeElement.nodeName ) {
			activeElement = document.body;
		}

		return activeElement;
	};


	/*!
 * jQuery UI Menu 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Menu
//>>group: Widgets
//>>description: Creates nestable menus.
//>>docs: http://api.jqueryui.com/menu/
//>>demos: http://jqueryui.com/menu/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/menu.css
//>>css.theme: ../../themes/base/theme.css


	var widgetsMenu = $.widget( "ui.menu", {
		version: "1.13.0",
		defaultElement: "<ul>",
		delay: 300,
		options: {
			icons: {
				submenu: "ui-icon-caret-1-e"
			},
			items: "> *",
			menus: "ul",
			position: {
				my: "left top",
				at: "right top"
			},
			role: "menu",

			// Callbacks
			blur: null,
			focus: null,
			select: null
		},

		_create: function() {
			this.activeMenu = this.element;

			// Flag used to prevent firing of the click handler
			// as the event bubbles up through nested menus
			this.mouseHandled = false;
			this.lastMousePosition = { x: null, y: null };
			this.element
			.uniqueId()
			.attr( {
				role: this.options.role,
				tabIndex: 0
			} );

			this._addClass( "ui-menu", "ui-widget ui-widget-content" );
			this._on( {

				// Prevent focus from sticking to links inside menu after clicking
				// them (focus should always stay on UL during navigation).
				"mousedown .ui-menu-item": function( event ) {
					event.preventDefault();

					this._activateItem( event );
				},
				"click .ui-menu-item": function( event ) {
					var target = $( event.target );
					var active = $( $.ui.safeActiveElement( this.document[ 0 ] ) );
					if ( !this.mouseHandled && target.not( ".ui-state-disabled" ).length ) {
						this.select( event );

						// Only set the mouseHandled flag if the event will bubble, see #9469.
						if ( !event.isPropagationStopped() ) {
							this.mouseHandled = true;
						}

						// Open submenu on click
						if ( target.has( ".ui-menu" ).length ) {
							this.expand( event );
						} else if ( !this.element.is( ":focus" ) &&
							active.closest( ".ui-menu" ).length ) {

							// Redirect focus to the menu
							this.element.trigger( "focus", [ true ] );

							// If the active item is on the top level, let it stay active.
							// Otherwise, blur the active item since it is no longer visible.
							if ( this.active && this.active.parents( ".ui-menu" ).length === 1 ) {
								clearTimeout( this.timer );
							}
						}
					}
				},
				"mouseenter .ui-menu-item": "_activateItem",
				"mousemove .ui-menu-item": "_activateItem",
				mouseleave: "collapseAll",
				"mouseleave .ui-menu": "collapseAll",
				focus: function( event, keepActiveItem ) {

					// If there's already an active item, keep it active
					// If not, activate the first item
					var item = this.active || this._menuItems().first();

					if ( !keepActiveItem ) {
						this.focus( event, item );
					}
				},
				blur: function( event ) {
					this._delay( function() {
						var notContained = !$.contains(
							this.element[ 0 ],
							$.ui.safeActiveElement( this.document[ 0 ] )
						);
						if ( notContained ) {
							this.collapseAll( event );
						}
					} );
				},
				keydown: "_keydown"
			} );

			this.refresh();

			// Clicks outside of a menu collapse any open menus
			this._on( this.document, {
				click: function( event ) {
					if ( this._closeOnDocumentClick( event ) ) {
						this.collapseAll( event, true );
					}

					// Reset the mouseHandled flag
					this.mouseHandled = false;
				}
			} );
		},

		_activateItem: function( event ) {

			// Ignore mouse events while typeahead is active, see #10458.
			// Prevents focusing the wrong item when typeahead causes a scroll while the mouse
			// is over an item in the menu
			if ( this.previousFilter ) {
				return;
			}

			// If the mouse didn't actually move, but the page was scrolled, ignore the event (#9356)
			if ( event.clientX === this.lastMousePosition.x &&
				event.clientY === this.lastMousePosition.y ) {
				return;
			}

			this.lastMousePosition = {
				x: event.clientX,
				y: event.clientY
			};

			var actualTarget = $( event.target ).closest( ".ui-menu-item" ),
				target = $( event.currentTarget );

			// Ignore bubbled events on parent items, see #11641
			if ( actualTarget[ 0 ] !== target[ 0 ] ) {
				return;
			}

			// If the item is already active, there's nothing to do
			if ( target.is( ".ui-state-active" ) ) {
				return;
			}

			// Remove ui-state-active class from siblings of the newly focused menu item
			// to avoid a jump caused by adjacent elements both having a class with a border
			this._removeClass( target.siblings().children( ".ui-state-active" ),
				null, "ui-state-active" );
			this.focus( event, target );
		},

		_destroy: function() {
			var items = this.element.find( ".ui-menu-item" )
				.removeAttr( "role aria-disabled" ),
				submenus = items.children( ".ui-menu-item-wrapper" )
				.removeUniqueId()
				.removeAttr( "tabIndex role aria-haspopup" );

			// Destroy (sub)menus
			this.element
			.removeAttr( "aria-activedescendant" )
			.find( ".ui-menu" ).addBack()
			.removeAttr( "role aria-labelledby aria-expanded aria-hidden aria-disabled " +
				"tabIndex" )
			.removeUniqueId()
			.show();

			submenus.children().each( function() {
				var elem = $( this );
				if ( elem.data( "ui-menu-submenu-caret" ) ) {
					elem.remove();
				}
			} );
		},

		_keydown: function( event ) {
			var match, prev, character, skip,
				preventDefault = true;

			switch ( event.keyCode ) {
				case $.ui.keyCode.PAGE_UP:
					this.previousPage( event );
					break;
				case $.ui.keyCode.PAGE_DOWN:
					this.nextPage( event );
					break;
				case $.ui.keyCode.HOME:
					this._move( "first", "first", event );
					break;
				case $.ui.keyCode.END:
					this._move( "last", "last", event );
					break;
				case $.ui.keyCode.UP:
					this.previous( event );
					break;
				case $.ui.keyCode.DOWN:
					this.next( event );
					break;
				case $.ui.keyCode.LEFT:
					this.collapse( event );
					break;
				case $.ui.keyCode.RIGHT:
					if ( this.active && !this.active.is( ".ui-state-disabled" ) ) {
						this.expand( event );
					}
					break;
				case $.ui.keyCode.ENTER:
				case $.ui.keyCode.SPACE:
					this._activate( event );
					break;
				case $.ui.keyCode.ESCAPE:
					this.collapse( event );
					break;
				default:
					preventDefault = false;
					prev = this.previousFilter || "";
					skip = false;

					// Support number pad values
					character = event.keyCode >= 96 && event.keyCode <= 105 ?
						( event.keyCode - 96 ).toString() : String.fromCharCode( event.keyCode );

					clearTimeout( this.filterTimer );

					if ( character === prev ) {
						skip = true;
					} else {
						character = prev + character;
					}

					match = this._filterMenuItems( character );
					match = skip && match.index( this.active.next() ) !== -1 ?
						this.active.nextAll( ".ui-menu-item" ) :
						match;

					// If no matches on the current filter, reset to the last character pressed
					// to move down the menu to the first item that starts with that character
					if ( !match.length ) {
						character = String.fromCharCode( event.keyCode );
						match = this._filterMenuItems( character );
					}

					if ( match.length ) {
						this.focus( event, match );
						this.previousFilter = character;
						this.filterTimer = this._delay( function() {
							delete this.previousFilter;
						}, 1000 );
					} else {
						delete this.previousFilter;
					}
			}

			if ( preventDefault ) {
				event.preventDefault();
			}
		},

		_activate: function( event ) {
			if ( this.active && !this.active.is( ".ui-state-disabled" ) ) {
				if ( this.active.children( "[aria-haspopup='true']" ).length ) {
					this.expand( event );
				} else {
					this.select( event );
				}
			}
		},

		refresh: function() {
			var menus, items, newSubmenus, newItems, newWrappers,
				that = this,
				icon = this.options.icons.submenu,
				submenus = this.element.find( this.options.menus );

			this._toggleClass( "ui-menu-icons", null, !!this.element.find( ".ui-icon" ).length );

			// Initialize nested menus
			newSubmenus = submenus.filter( ":not(.ui-menu)" )
			.hide()
			.attr( {
				role: this.options.role,
				"aria-hidden": "true",
				"aria-expanded": "false"
			} )
			.each( function() {
				var menu = $( this ),
					item = menu.prev(),
					submenuCaret = $( "<span>" ).data( "ui-menu-submenu-caret", true );

				that._addClass( submenuCaret, "ui-menu-icon", "ui-icon " + icon );
				item
				.attr( "aria-haspopup", "true" )
				.prepend( submenuCaret );
				menu.attr( "aria-labelledby", item.attr( "id" ) );
			} );

			this._addClass( newSubmenus, "ui-menu", "ui-widget ui-widget-content ui-front" );

			menus = submenus.add( this.element );
			items = menus.find( this.options.items );

			// Initialize menu-items containing spaces and/or dashes only as dividers
			items.not( ".ui-menu-item" ).each( function() {
				var item = $( this );
				if ( that._isDivider( item ) ) {
					that._addClass( item, "ui-menu-divider", "ui-widget-content" );
				}
			} );

			// Don't refresh list items that are already adapted
			newItems = items.not( ".ui-menu-item, .ui-menu-divider" );
			newWrappers = newItems.children()
			.not( ".ui-menu" )
			.uniqueId()
			.attr( {
				tabIndex: -1,
				role: this._itemRole()
			} );
			this._addClass( newItems, "ui-menu-item" )
			._addClass( newWrappers, "ui-menu-item-wrapper" );

			// Add aria-disabled attribute to any disabled menu item
			items.filter( ".ui-state-disabled" ).attr( "aria-disabled", "true" );

			// If the active item has been removed, blur the menu
			if ( this.active && !$.contains( this.element[ 0 ], this.active[ 0 ] ) ) {
				this.blur();
			}
		},

		_itemRole: function() {
			return {
				menu: "menuitem",
				listbox: "option"
			}[ this.options.role ];
		},

		_setOption: function( key, value ) {
			if ( key === "icons" ) {
				var icons = this.element.find( ".ui-menu-icon" );
				this._removeClass( icons, null, this.options.icons.submenu )
				._addClass( icons, null, value.submenu );
			}
			this._super( key, value );
		},

		_setOptionDisabled: function( value ) {
			this._super( value );

			this.element.attr( "aria-disabled", String( value ) );
			this._toggleClass( null, "ui-state-disabled", !!value );
		},

		focus: function( event, item ) {
			var nested, focused, activeParent;
			this.blur( event, event && event.type === "focus" );

			this._scrollIntoView( item );

			this.active = item.first();

			focused = this.active.children( ".ui-menu-item-wrapper" );
			this._addClass( focused, null, "ui-state-active" );

			// Only update aria-activedescendant if there's a role
			// otherwise we assume focus is managed elsewhere
			if ( this.options.role ) {
				this.element.attr( "aria-activedescendant", focused.attr( "id" ) );
			}

			// Highlight active parent menu item, if any
			activeParent = this.active
			.parent()
			.closest( ".ui-menu-item" )
			.children( ".ui-menu-item-wrapper" );
			this._addClass( activeParent, null, "ui-state-active" );

			if ( event && event.type === "keydown" ) {
				this._close();
			} else {
				this.timer = this._delay( function() {
					this._close();
				}, this.delay );
			}

			nested = item.children( ".ui-menu" );
			if ( nested.length && event && ( /^mouse/.test( event.type ) ) ) {
				this._startOpening( nested );
			}
			this.activeMenu = item.parent();

			this._trigger( "focus", event, { item: item } );
		},

		_scrollIntoView: function( item ) {
			var borderTop, paddingTop, offset, scroll, elementHeight, itemHeight;
			if ( this._hasScroll() ) {
				borderTop = parseFloat( $.css( this.activeMenu[ 0 ], "borderTopWidth" ) ) || 0;
				paddingTop = parseFloat( $.css( this.activeMenu[ 0 ], "paddingTop" ) ) || 0;
				offset = item.offset().top - this.activeMenu.offset().top - borderTop - paddingTop;
				scroll = this.activeMenu.scrollTop();
				elementHeight = this.activeMenu.height();
				itemHeight = item.outerHeight();

				if ( offset < 0 ) {
					this.activeMenu.scrollTop( scroll + offset );
				} else if ( offset + itemHeight > elementHeight ) {
					this.activeMenu.scrollTop( scroll + offset - elementHeight + itemHeight );
				}
			}
		},

		blur: function( event, fromFocus ) {
			if ( !fromFocus ) {
				clearTimeout( this.timer );
			}

			if ( !this.active ) {
				return;
			}

			this._removeClass( this.active.children( ".ui-menu-item-wrapper" ),
				null, "ui-state-active" );

			this._trigger( "blur", event, { item: this.active } );
			this.active = null;
		},

		_startOpening: function( submenu ) {
			clearTimeout( this.timer );

			// Don't open if already open fixes a Firefox bug that caused a .5 pixel
			// shift in the submenu position when mousing over the caret icon
			if ( submenu.attr( "aria-hidden" ) !== "true" ) {
				return;
			}

			this.timer = this._delay( function() {
				this._close();
				this._open( submenu );
			}, this.delay );
		},

		_open: function( submenu ) {
			var position = $.extend( {
				of: this.active
			}, this.options.position );

			clearTimeout( this.timer );
			this.element.find( ".ui-menu" ).not( submenu.parents( ".ui-menu" ) )
			.hide()
			.attr( "aria-hidden", "true" );

			submenu
			.show()
			.removeAttr( "aria-hidden" )
			.attr( "aria-expanded", "true" )
			.position( position );
		},

		collapseAll: function( event, all ) {
			clearTimeout( this.timer );
			this.timer = this._delay( function() {

				// If we were passed an event, look for the submenu that contains the event
				var currentMenu = all ? this.element :
					$( event && event.target ).closest( this.element.find( ".ui-menu" ) );

				// If we found no valid submenu ancestor, use the main menu to close all
				// sub menus anyway
				if ( !currentMenu.length ) {
					currentMenu = this.element;
				}

				this._close( currentMenu );

				this.blur( event );

				// Work around active item staying active after menu is blurred
				this._removeClass( currentMenu.find( ".ui-state-active" ), null, "ui-state-active" );

				this.activeMenu = currentMenu;
			}, all ? 0 : this.delay );
		},

		// With no arguments, closes the currently active menu - if nothing is active
		// it closes all menus.  If passed an argument, it will search for menus BELOW
		_close: function( startMenu ) {
			if ( !startMenu ) {
				startMenu = this.active ? this.active.parent() : this.element;
			}

			startMenu.find( ".ui-menu" )
			.hide()
			.attr( "aria-hidden", "true" )
			.attr( "aria-expanded", "false" );
		},

		_closeOnDocumentClick: function( event ) {
			return !$( event.target ).closest( ".ui-menu" ).length;
		},

		_isDivider: function( item ) {

			// Match hyphen, em dash, en dash
			return !/[^\-\u2014\u2013\s]/.test( item.text() );
		},

		collapse: function( event ) {
			var newItem = this.active &&
				this.active.parent().closest( ".ui-menu-item", this.element );
			if ( newItem && newItem.length ) {
				this._close();
				this.focus( event, newItem );
			}
		},

		expand: function( event ) {
			var newItem = this.active && this._menuItems( this.active.children( ".ui-menu" ) ).first();

			if ( newItem && newItem.length ) {
				this._open( newItem.parent() );

				// Delay so Firefox will not hide activedescendant change in expanding submenu from AT
				this._delay( function() {
					this.focus( event, newItem );
				} );
			}
		},

		next: function( event ) {
			this._move( "next", "first", event );
		},

		previous: function( event ) {
			this._move( "prev", "last", event );
		},

		isFirstItem: function() {
			return this.active && !this.active.prevAll( ".ui-menu-item" ).length;
		},

		isLastItem: function() {
			return this.active && !this.active.nextAll( ".ui-menu-item" ).length;
		},

		_menuItems: function( menu ) {
			return ( menu || this.element )
			.find( this.options.items )
			.filter( ".ui-menu-item" );
		},

		_move: function( direction, filter, event ) {
			var next;
			if ( this.active ) {
				if ( direction === "first" || direction === "last" ) {
					next = this.active
						[ direction === "first" ? "prevAll" : "nextAll" ]( ".ui-menu-item" )
					.last();
				} else {
					next = this.active
						[ direction + "All" ]( ".ui-menu-item" )
					.first();
				}
			}
			if ( !next || !next.length || !this.active ) {
				next = this._menuItems( this.activeMenu )[ filter ]();
			}

			this.focus( event, next );
		},

		nextPage: function( event ) {
			var item, base, height;

			if ( !this.active ) {
				this.next( event );
				return;
			}
			if ( this.isLastItem() ) {
				return;
			}
			if ( this._hasScroll() ) {
				base = this.active.offset().top;
				height = this.element.innerHeight();

				// jQuery 3.2 doesn't include scrollbars in innerHeight, add it back.
				if ( $.fn.jquery.indexOf( "3.2." ) === 0 ) {
					height += this.element[ 0 ].offsetHeight - this.element.outerHeight();
				}

				this.active.nextAll( ".ui-menu-item" ).each( function() {
					item = $( this );
					return item.offset().top - base - height < 0;
				} );

				this.focus( event, item );
			} else {
				this.focus( event, this._menuItems( this.activeMenu )
					[ !this.active ? "first" : "last" ]() );
			}
		},

		previousPage: function( event ) {
			var item, base, height;
			if ( !this.active ) {
				this.next( event );
				return;
			}
			if ( this.isFirstItem() ) {
				return;
			}
			if ( this._hasScroll() ) {
				base = this.active.offset().top;
				height = this.element.innerHeight();

				// jQuery 3.2 doesn't include scrollbars in innerHeight, add it back.
				if ( $.fn.jquery.indexOf( "3.2." ) === 0 ) {
					height += this.element[ 0 ].offsetHeight - this.element.outerHeight();
				}

				this.active.prevAll( ".ui-menu-item" ).each( function() {
					item = $( this );
					return item.offset().top - base + height > 0;
				} );

				this.focus( event, item );
			} else {
				this.focus( event, this._menuItems( this.activeMenu ).first() );
			}
		},

		_hasScroll: function() {
			return this.element.outerHeight() < this.element.prop( "scrollHeight" );
		},

		select: function( event ) {

			// TODO: It should never be possible to not have an active item at this
			// point, but the tests don't trigger mouseenter before click.
			this.active = this.active || $( event.target ).closest( ".ui-menu-item" );
			var ui = { item: this.active };
			if ( !this.active.has( ".ui-menu" ).length ) {
				this.collapseAll( event, true );
			}
			this._trigger( "select", event, ui );
		},

		_filterMenuItems: function( character ) {
			var escapedCharacter = character.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" ),
				regex = new RegExp( "^" + escapedCharacter, "i" );

			return this.activeMenu
			.find( this.options.items )

			// Only match on items, not dividers or other content (#10571)
			.filter( ".ui-menu-item" )
			.filter( function() {
				return regex.test(
					String.prototype.trim.call(
						$( this ).children( ".ui-menu-item-wrapper" ).text() ) );
			} );
		}
	} );


	/*!
 * jQuery UI Autocomplete 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Autocomplete
//>>group: Widgets
//>>description: Lists suggested words as the user is typing.
//>>docs: http://api.jqueryui.com/autocomplete/
//>>demos: http://jqueryui.com/autocomplete/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/autocomplete.css
//>>css.theme: ../../themes/base/theme.css


	$.widget( "ui.autocomplete", {
		version: "1.13.0",
		defaultElement: "<input>",
		options: {
			appendTo: null,
			autoFocus: false,
			delay: 300,
			minLength: 1,
			position: {
				my: "left top",
				at: "left bottom",
				collision: "none"
			},
			source: null,

			// Callbacks
			change: null,
			close: null,
			focus: null,
			open: null,
			response: null,
			search: null,
			select: null
		},

		requestIndex: 0,
		pending: 0,

		_create: function() {

			// Some browsers only repeat keydown events, not keypress events,
			// so we use the suppressKeyPress flag to determine if we've already
			// handled the keydown event. #7269
			// Unfortunately the code for & in keypress is the same as the up arrow,
			// so we use the suppressKeyPressRepeat flag to avoid handling keypress
			// events when we know the keydown event was used to modify the
			// search term. #7799
			var suppressKeyPress, suppressKeyPressRepeat, suppressInput,
				nodeName = this.element[ 0 ].nodeName.toLowerCase(),
				isTextarea = nodeName === "textarea",
				isInput = nodeName === "input";

			// Textareas are always multi-line
			// Inputs are always single-line, even if inside a contentEditable element
			// IE also treats inputs as contentEditable
			// All other element types are determined by whether or not they're contentEditable
			this.isMultiLine = isTextarea || !isInput && this._isContentEditable( this.element );

			this.valueMethod = this.element[ isTextarea || isInput ? "val" : "text" ];
			this.isNewMenu = true;

			this._addClass( "ui-autocomplete-input" );
			this.element.attr( "autocomplete", "off" );

			this._on( this.element, {
				keydown: function( event ) {
					if ( this.element.prop( "readOnly" ) ) {
						suppressKeyPress = true;
						suppressInput = true;
						suppressKeyPressRepeat = true;
						return;
					}

					suppressKeyPress = false;
					suppressInput = false;
					suppressKeyPressRepeat = false;
					var keyCode = $.ui.keyCode;
					switch ( event.keyCode ) {
						case keyCode.PAGE_UP:
							suppressKeyPress = true;
							this._move( "previousPage", event );
							break;
						case keyCode.PAGE_DOWN:
							suppressKeyPress = true;
							this._move( "nextPage", event );
							break;
						case keyCode.UP:
							suppressKeyPress = true;
							this._keyEvent( "previous", event );
							break;
						case keyCode.DOWN:
							suppressKeyPress = true;
							this._keyEvent( "next", event );
							break;
						case keyCode.ENTER:

							// when menu is open and has focus
							if ( this.menu.active ) {

								// #6055 - Opera still allows the keypress to occur
								// which causes forms to submit
								suppressKeyPress = true;
								event.preventDefault();
								this.menu.select( event );
							}
							break;
						case keyCode.TAB:
							if ( this.menu.active ) {
								this.menu.select( event );
							}
							break;
						case keyCode.ESCAPE:
							if ( this.menu.element.is( ":visible" ) ) {
								if ( !this.isMultiLine ) {
									this._value( this.term );
								}
								this.close( event );

								// Different browsers have different default behavior for escape
								// Single press can mean undo or clear
								// Double press in IE means clear the whole form
								event.preventDefault();
							}
							break;
						default:
							suppressKeyPressRepeat = true;

							// search timeout should be triggered before the input value is changed
							this._searchTimeout( event );
							break;
					}
				},
				keypress: function( event ) {
					if ( suppressKeyPress ) {
						suppressKeyPress = false;
						if ( !this.isMultiLine || this.menu.element.is( ":visible" ) ) {
							event.preventDefault();
						}
						return;
					}
					if ( suppressKeyPressRepeat ) {
						return;
					}

					// Replicate some key handlers to allow them to repeat in Firefox and Opera
					var keyCode = $.ui.keyCode;
					switch ( event.keyCode ) {
						case keyCode.PAGE_UP:
							this._move( "previousPage", event );
							break;
						case keyCode.PAGE_DOWN:
							this._move( "nextPage", event );
							break;
						case keyCode.UP:
							this._keyEvent( "previous", event );
							break;
						case keyCode.DOWN:
							this._keyEvent( "next", event );
							break;
					}
				},
				input: function( event ) {
					if ( suppressInput ) {
						suppressInput = false;
						event.preventDefault();
						return;
					}
					this._searchTimeout( event );
				},
				focus: function() {
					this.selectedItem = null;
					this.previous = this._value();
				},
				blur: function( event ) {
					clearTimeout( this.searching );
					this.close( event );
					this._change( event );
				}
			} );

			this._initSource();
			this.menu = $( "<ul>" )
			.appendTo( this._appendTo() )
			.menu( {

				// disable ARIA support, the live region takes care of that
				role: null
			} )
			.hide()

			// Support: IE 11 only, Edge <= 14
			// For other browsers, we preventDefault() on the mousedown event
			// to keep the dropdown from taking focus from the input. This doesn't
			// work for IE/Edge, causing problems with selection and scrolling (#9638)
			// Happily, IE and Edge support an "unselectable" attribute that
			// prevents an element from receiving focus, exactly what we want here.
			.attr( {
				"unselectable": "on"
			} )
			.menu( "instance" );

			this._addClass( this.menu.element, "ui-autocomplete", "ui-front" );
			this._on( this.menu.element, {
				mousedown: function( event ) {

					// Prevent moving focus out of the text field
					event.preventDefault();
				},
				menufocus: function( event, ui ) {
					var label, item;

					// support: Firefox
					// Prevent accidental activation of menu items in Firefox (#7024 #9118)
					if ( this.isNewMenu ) {
						this.isNewMenu = false;
						if ( event.originalEvent && /^mouse/.test( event.originalEvent.type ) ) {
							this.menu.blur();

							this.document.one( "mousemove", function() {
								$( event.target ).trigger( event.originalEvent );
							} );

							return;
						}
					}

					item = ui.item.data( "ui-autocomplete-item" );
					if ( false !== this._trigger( "focus", event, { item: item } ) ) {

						// use value to match what will end up in the input, if it was a key event
						if ( event.originalEvent && /^key/.test( event.originalEvent.type ) ) {
							this._value( item.value );
						}
					}

					// Announce the value in the liveRegion
					label = ui.item.attr( "aria-label" ) || item.value;
					if ( label && String.prototype.trim.call( label ).length ) {
						this.liveRegion.children().hide();
						$( "<div>" ).text( label ).appendTo( this.liveRegion );
					}
				},
				menuselect: function( event, ui ) {
					var item = ui.item.data( "ui-autocomplete-item" ),
						previous = this.previous;

					// Only trigger when focus was lost (click on menu)
					if ( this.element[ 0 ] !== $.ui.safeActiveElement( this.document[ 0 ] ) ) {
						this.element.trigger( "focus" );
						this.previous = previous;

						// #6109 - IE triggers two focus events and the second
						// is asynchronous, so we need to reset the previous
						// term synchronously and asynchronously :-(
						this._delay( function() {
							this.previous = previous;
							this.selectedItem = item;
						} );
					}

					if ( false !== this._trigger( "select", event, { item: item } ) ) {
						this._value( item.value );
					}

					// reset the term after the select event
					// this allows custom select handling to work properly
					this.term = this._value();

					this.close( event );
					this.selectedItem = item;
				}
			} );

			this.liveRegion = $( "<div>", {
				role: "status",
				"aria-live": "assertive",
				"aria-relevant": "additions"
			} )
			.appendTo( this.document[ 0 ].body );

			this._addClass( this.liveRegion, null, "ui-helper-hidden-accessible" );

			// Turning off autocomplete prevents the browser from remembering the
			// value when navigating through history, so we re-enable autocomplete
			// if the page is unloaded before the widget is destroyed. #7790
			this._on( this.window, {
				beforeunload: function() {
					this.element.removeAttr( "autocomplete" );
				}
			} );
		},

		_destroy: function() {
			clearTimeout( this.searching );
			this.element.removeAttr( "autocomplete" );
			this.menu.element.remove();
			this.liveRegion.remove();
		},

		_setOption: function( key, value ) {
			this._super( key, value );
			if ( key === "source" ) {
				this._initSource();
			}
			if ( key === "appendTo" ) {
				this.menu.element.appendTo( this._appendTo() );
			}
			if ( key === "disabled" && value && this.xhr ) {
				this.xhr.abort();
			}
		},

		_isEventTargetInWidget: function( event ) {
			var menuElement = this.menu.element[ 0 ];

			return event.target === this.element[ 0 ] ||
				event.target === menuElement ||
				$.contains( menuElement, event.target );
		},

		_closeOnClickOutside: function( event ) {
			if ( !this._isEventTargetInWidget( event ) ) {
				this.close();
			}
		},

		_appendTo: function() {
			var element = this.options.appendTo;

			if ( element ) {
				element = element.jquery || element.nodeType ?
					$( element ) :
					this.document.find( element ).eq( 0 );
			}

			if ( !element || !element[ 0 ] ) {
				element = this.element.closest( ".ui-front, dialog" );
			}

			if ( !element.length ) {
				element = this.document[ 0 ].body;
			}

			return element;
		},

		_initSource: function() {
			var array, url,
				that = this;
			if ( Array.isArray( this.options.source ) ) {
				array = this.options.source;
				this.source = function( request, response ) {
					response( $.ui.autocomplete.filter( array, request.term ) );
				};
			} else if ( typeof this.options.source === "string" ) {
				url = this.options.source;
				this.source = function( request, response ) {
					if ( that.xhr ) {
						that.xhr.abort();
					}
					that.xhr = $.ajax( {
						url: url,
						data: request,
						dataType: "json",
						success: function( data ) {
							response( data );
						},
						error: function() {
							response( [] );
						}
					} );
				};
			} else {
				this.source = this.options.source;
			}
		},

		_searchTimeout: function( event ) {
			clearTimeout( this.searching );
			this.searching = this._delay( function() {

				// Search if the value has changed, or if the user retypes the same value (see #7434)
				var equalValues = this.term === this._value(),
					menuVisible = this.menu.element.is( ":visible" ),
					modifierKey = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

				if ( !equalValues || ( equalValues && !menuVisible && !modifierKey ) ) {
					this.selectedItem = null;
					this.search( null, event );
				}
			}, this.options.delay );
		},

		search: function( value, event ) {
			value = value != null ? value : this._value();

			// Always save the actual value, not the one passed as an argument
			this.term = this._value();

			if ( value.length < this.options.minLength ) {
				return this.close( event );
			}

			if ( this._trigger( "search", event ) === false ) {
				return;
			}

			return this._search( value );
		},

		_search: function( value ) {
			this.pending++;
			this._addClass( "ui-autocomplete-loading" );
			this.cancelSearch = false;

			this.source( { term: value }, this._response() );
		},

		_response: function() {
			var index = ++this.requestIndex;

			return function( content ) {
				if ( index === this.requestIndex ) {
					this.__response( content );
				}

				this.pending--;
				if ( !this.pending ) {
					this._removeClass( "ui-autocomplete-loading" );
				}
			}.bind( this );
		},

		__response: function( content ) {
			if ( content ) {
				content = this._normalize( content );
			}
			this._trigger( "response", null, { content: content } );
			if ( !this.options.disabled && content && content.length && !this.cancelSearch ) {
				this._suggest( content );
				this._trigger( "open" );
			} else {

				// use ._close() instead of .close() so we don't cancel future searches
				this._close();
			}
		},

		close: function( event ) {
			this.cancelSearch = true;
			this._close( event );
		},

		_close: function( event ) {

			// Remove the handler that closes the menu on outside clicks
			this._off( this.document, "mousedown" );

			if ( this.menu.element.is( ":visible" ) ) {
				this.menu.element.hide();
				this.menu.blur();
				this.isNewMenu = true;
				this._trigger( "close", event );
			}
		},

		_change: function( event ) {
			if ( this.previous !== this._value() ) {
				this._trigger( "change", event, { item: this.selectedItem } );
			}
		},

		_normalize: function( items ) {

			// assume all items have the right format when the first item is complete
			if ( items.length && items[ 0 ].label && items[ 0 ].value ) {
				return items;
			}
			return $.map( items, function( item ) {
				if ( typeof item === "string" ) {
					return {
						label: item,
						value: item
					};
				}
				return $.extend( {}, item, {
					label: item.label || item.value,
					value: item.value || item.label
				} );
			} );
		},

		_suggest: function( items ) {
			var ul = this.menu.element.empty();
			this._renderMenu( ul, items );
			this.isNewMenu = true;
			this.menu.refresh();

			// Size and position menu
			ul.show();
			this._resizeMenu();
			ul.position( $.extend( {
				of: this.element
			}, this.options.position ) );

			if ( this.options.autoFocus ) {
				this.menu.next();
			}

			// Listen for interactions outside of the widget (#6642)
			this._on( this.document, {
				mousedown: "_closeOnClickOutside"
			} );
		},

		_resizeMenu: function() {
			var ul = this.menu.element;
			ul.outerWidth( Math.max(

				// Firefox wraps long text (possibly a rounding bug)
				// so we add 1px to avoid the wrapping (#7513)
				ul.width( "" ).outerWidth() + 1,
				this.element.outerWidth()
			) );
		},

		_renderMenu: function( ul, items ) {
			var that = this;
			$.each( items, function( index, item ) {
				that._renderItemData( ul, item );
			} );
		},

		_renderItemData: function( ul, item ) {
			return this._renderItem( ul, item ).data( "ui-autocomplete-item", item );
		},

		_renderItem: function( ul, item ) {
			return $( "<li>" )
			.append( $( "<div>" ).text( item.label ) )
			.appendTo( ul );
		},

		_move: function( direction, event ) {
			if ( !this.menu.element.is( ":visible" ) ) {
				this.search( null, event );
				return;
			}
			if ( this.menu.isFirstItem() && /^previous/.test( direction ) ||
				this.menu.isLastItem() && /^next/.test( direction ) ) {

				if ( !this.isMultiLine ) {
					this._value( this.term );
				}

				this.menu.blur();
				return;
			}
			this.menu[ direction ]( event );
		},

		widget: function() {
			return this.menu.element;
		},

		_value: function() {
			return this.valueMethod.apply( this.element, arguments );
		},

		_keyEvent: function( keyEvent, event ) {
			if ( !this.isMultiLine || this.menu.element.is( ":visible" ) ) {
				this._move( keyEvent, event );

				// Prevents moving cursor to beginning/end of the text field in some browsers
				event.preventDefault();
			}
		},

		// Support: Chrome <=50
		// We should be able to just use this.element.prop( "isContentEditable" )
		// but hidden elements always report false in Chrome.
		// https://code.google.com/p/chromium/issues/detail?id=313082
		_isContentEditable: function( element ) {
			if ( !element.length ) {
				return false;
			}

			var editable = element.prop( "contentEditable" );

			if ( editable === "inherit" ) {
				return this._isContentEditable( element.parent() );
			}

			return editable === "true";
		}
	} );

	$.extend( $.ui.autocomplete, {
		escapeRegex: function( value ) {
			return value.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" );
		},
		filter: function( array, term ) {
			var matcher = new RegExp( $.ui.autocomplete.escapeRegex( term ), "i" );
			return $.grep( array, function( value ) {
				return matcher.test( value.label || value.value || value );
			} );
		}
	} );

// Live region extension, adding a `messages` option
// NOTE: This is an experimental API. We are still investigating
// a full solution for string manipulation and internationalization.
	$.widget( "ui.autocomplete", $.ui.autocomplete, {
		options: {
			messages: {
				noResults: "No search results.",
				results: function( amount ) {
					return amount + ( amount > 1 ? " results are" : " result is" ) +
						" available, use up and down arrow keys to navigate.";
				}
			}
		},

		__response: function( content ) {
			var message;
			this._superApply( arguments );
			if ( this.options.disabled || this.cancelSearch ) {
				return;
			}
			if ( content && content.length ) {
				message = this.options.messages.results( content.length );
			} else {
				message = this.options.messages.noResults;
			}
			this.liveRegion.children().hide();
			$( "<div>" ).text( message ).appendTo( this.liveRegion );
		}
	} );

	var widgetsAutocomplete = $.ui.autocomplete;


	/*!
 * jQuery UI Controlgroup 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Controlgroup
//>>group: Widgets
//>>description: Visually groups form control widgets
//>>docs: http://api.jqueryui.com/controlgroup/
//>>demos: http://jqueryui.com/controlgroup/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/controlgroup.css
//>>css.theme: ../../themes/base/theme.css


	var controlgroupCornerRegex = /ui-corner-([a-z]){2,6}/g;

	var widgetsControlgroup = $.widget( "ui.controlgroup", {
		version: "1.13.0",
		defaultElement: "<div>",
		options: {
			direction: "horizontal",
			disabled: null,
			onlyVisible: true,
			items: {
				"button": "input[type=button], input[type=submit], input[type=reset], button, a",
				"controlgroupLabel": ".ui-controlgroup-label",
				"checkboxradio": "input[type='checkbox'], input[type='radio']",
				"selectmenu": "select",
				"spinner": ".ui-spinner-input"
			}
		},

		_create: function() {
			this._enhance();
		},

		// To support the enhanced option in jQuery Mobile, we isolate DOM manipulation
		_enhance: function() {
			this.element.attr( "role", "toolbar" );
			this.refresh();
		},

		_destroy: function() {
			this._callChildMethod( "destroy" );
			this.childWidgets.removeData( "ui-controlgroup-data" );
			this.element.removeAttr( "role" );
			if ( this.options.items.controlgroupLabel ) {
				this.element
				.find( this.options.items.controlgroupLabel )
				.find( ".ui-controlgroup-label-contents" )
				.contents().unwrap();
			}
		},

		_initWidgets: function() {
			var that = this,
				childWidgets = [];

			// First we iterate over each of the items options
			$.each( this.options.items, function( widget, selector ) {
				var labels;
				var options = {};

				// Make sure the widget has a selector set
				if ( !selector ) {
					return;
				}

				if ( widget === "controlgroupLabel" ) {
					labels = that.element.find( selector );
					labels.each( function() {
						var element = $( this );

						if ( element.children( ".ui-controlgroup-label-contents" ).length ) {
							return;
						}
						element.contents()
						.wrapAll( "<span class='ui-controlgroup-label-contents'></span>" );
					} );
					that._addClass( labels, null, "ui-widget ui-widget-content ui-state-default" );
					childWidgets = childWidgets.concat( labels.get() );
					return;
				}

				// Make sure the widget actually exists
				if ( !$.fn[ widget ] ) {
					return;
				}

				// We assume everything is in the middle to start because we can't determine
				// first / last elements until all enhancments are done.
				if ( that[ "_" + widget + "Options" ] ) {
					options = that[ "_" + widget + "Options" ]( "middle" );
				} else {
					options = { classes: {} };
				}

				// Find instances of this widget inside controlgroup and init them
				that.element
				.find( selector )
				.each( function() {
					var element = $( this );
					var instance = element[ widget ]( "instance" );

					// We need to clone the default options for this type of widget to avoid
					// polluting the variable options which has a wider scope than a single widget.
					var instanceOptions = $.widget.extend( {}, options );

					// If the button is the child of a spinner ignore it
					// TODO: Find a more generic solution
					if ( widget === "button" && element.parent( ".ui-spinner" ).length ) {
						return;
					}

					// Create the widget if it doesn't exist
					if ( !instance ) {
						instance = element[ widget ]()[ widget ]( "instance" );
					}
					if ( instance ) {
						instanceOptions.classes =
							that._resolveClassesValues( instanceOptions.classes, instance );
					}
					element[ widget ]( instanceOptions );

					// Store an instance of the controlgroup to be able to reference
					// from the outermost element for changing options and refresh
					var widgetElement = element[ widget ]( "widget" );
					$.data( widgetElement[ 0 ], "ui-controlgroup-data",
						instance ? instance : element[ widget ]( "instance" ) );

					childWidgets.push( widgetElement[ 0 ] );
				} );
			} );

			this.childWidgets = $( $.uniqueSort( childWidgets ) );
			this._addClass( this.childWidgets, "ui-controlgroup-item" );
		},

		_callChildMethod: function( method ) {
			this.childWidgets.each( function() {
				var element = $( this ),
					data = element.data( "ui-controlgroup-data" );
				if ( data && data[ method ] ) {
					data[ method ]();
				}
			} );
		},

		_updateCornerClass: function( element, position ) {
			var remove = "ui-corner-top ui-corner-bottom ui-corner-left ui-corner-right ui-corner-all";
			var add = this._buildSimpleOptions( position, "label" ).classes.label;

			this._removeClass( element, null, remove );
			this._addClass( element, null, add );
		},

		_buildSimpleOptions: function( position, key ) {
			var direction = this.options.direction === "vertical";
			var result = {
				classes: {}
			};
			result.classes[ key ] = {
				"middle": "",
				"first": "ui-corner-" + ( direction ? "top" : "left" ),
				"last": "ui-corner-" + ( direction ? "bottom" : "right" ),
				"only": "ui-corner-all"
			}[ position ];

			return result;
		},

		_spinnerOptions: function( position ) {
			var options = this._buildSimpleOptions( position, "ui-spinner" );

			options.classes[ "ui-spinner-up" ] = "";
			options.classes[ "ui-spinner-down" ] = "";

			return options;
		},

		_buttonOptions: function( position ) {
			return this._buildSimpleOptions( position, "ui-button" );
		},

		_checkboxradioOptions: function( position ) {
			return this._buildSimpleOptions( position, "ui-checkboxradio-label" );
		},

		_selectmenuOptions: function( position ) {
			var direction = this.options.direction === "vertical";
			return {
				width: direction ? "auto" : false,
				classes: {
					middle: {
						"ui-selectmenu-button-open": "",
						"ui-selectmenu-button-closed": ""
					},
					first: {
						"ui-selectmenu-button-open": "ui-corner-" + ( direction ? "top" : "tl" ),
						"ui-selectmenu-button-closed": "ui-corner-" + ( direction ? "top" : "left" )
					},
					last: {
						"ui-selectmenu-button-open": direction ? "" : "ui-corner-tr",
						"ui-selectmenu-button-closed": "ui-corner-" + ( direction ? "bottom" : "right" )
					},
					only: {
						"ui-selectmenu-button-open": "ui-corner-top",
						"ui-selectmenu-button-closed": "ui-corner-all"
					}

				}[ position ]
			};
		},

		_resolveClassesValues: function( classes, instance ) {
			var result = {};
			$.each( classes, function( key ) {
				var current = instance.options.classes[ key ] || "";
				current = String.prototype.trim.call( current.replace( controlgroupCornerRegex, "" ) );
				result[ key ] = ( current + " " + classes[ key ] ).replace( /\s+/g, " " );
			} );
			return result;
		},

		_setOption: function( key, value ) {
			if ( key === "direction" ) {
				this._removeClass( "ui-controlgroup-" + this.options.direction );
			}

			this._super( key, value );
			if ( key === "disabled" ) {
				this._callChildMethod( value ? "disable" : "enable" );
				return;
			}

			this.refresh();
		},

		refresh: function() {
			var children,
				that = this;

			this._addClass( "ui-controlgroup ui-controlgroup-" + this.options.direction );

			if ( this.options.direction === "horizontal" ) {
				this._addClass( null, "ui-helper-clearfix" );
			}
			this._initWidgets();

			children = this.childWidgets;

			// We filter here because we need to track all childWidgets not just the visible ones
			if ( this.options.onlyVisible ) {
				children = children.filter( ":visible" );
			}

			if ( children.length ) {

				// We do this last because we need to make sure all enhancment is done
				// before determining first and last
				$.each( [ "first", "last" ], function( index, value ) {
					var instance = children[ value ]().data( "ui-controlgroup-data" );

					if ( instance && that[ "_" + instance.widgetName + "Options" ] ) {
						var options = that[ "_" + instance.widgetName + "Options" ](
							children.length === 1 ? "only" : value
						);
						options.classes = that._resolveClassesValues( options.classes, instance );
						instance.element[ instance.widgetName ]( options );
					} else {
						that._updateCornerClass( children[ value ](), value );
					}
				} );

				// Finally call the refresh method on each of the child widgets.
				this._callChildMethod( "refresh" );
			}
		}
	} );

	/*!
 * jQuery UI Checkboxradio 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Checkboxradio
//>>group: Widgets
//>>description: Enhances a form with multiple themeable checkboxes or radio buttons.
//>>docs: http://api.jqueryui.com/checkboxradio/
//>>demos: http://jqueryui.com/checkboxradio/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/button.css
//>>css.structure: ../../themes/base/checkboxradio.css
//>>css.theme: ../../themes/base/theme.css


	$.widget( "ui.checkboxradio", [ $.ui.formResetMixin, {
		version: "1.13.0",
		options: {
			disabled: null,
			label: null,
			icon: true,
			classes: {
				"ui-checkboxradio-label": "ui-corner-all",
				"ui-checkboxradio-icon": "ui-corner-all"
			}
		},

		_getCreateOptions: function() {
			var disabled, labels;
			var that = this;
			var options = this._super() || {};

			// We read the type here, because it makes more sense to throw a element type error first,
			// rather then the error for lack of a label. Often if its the wrong type, it
			// won't have a label (e.g. calling on a div, btn, etc)
			this._readType();

			labels = this.element.labels();

			// If there are multiple labels, use the last one
			this.label = $( labels[ labels.length - 1 ] );
			if ( !this.label.length ) {
				$.error( "No label found for checkboxradio widget" );
			}

			this.originalLabel = "";

			// We need to get the label text but this may also need to make sure it does not contain the
			// input itself.
			this.label.contents().not( this.element[ 0 ] ).each( function() {

				// The label contents could be text, html, or a mix. We concat each element to get a
				// string representation of the label, without the input as part of it.
				that.originalLabel += this.nodeType === 3 ? $( this ).text() : this.outerHTML;
			} );

			// Set the label option if we found label text
			if ( this.originalLabel ) {
				options.label = this.originalLabel;
			}

			disabled = this.element[ 0 ].disabled;
			if ( disabled != null ) {
				options.disabled = disabled;
			}
			return options;
		},

		_create: function() {
			var checked = this.element[ 0 ].checked;

			this._bindFormResetHandler();

			if ( this.options.disabled == null ) {
				this.options.disabled = this.element[ 0 ].disabled;
			}

			this._setOption( "disabled", this.options.disabled );
			this._addClass( "ui-checkboxradio", "ui-helper-hidden-accessible" );
			this._addClass( this.label, "ui-checkboxradio-label", "ui-button ui-widget" );

			if ( this.type === "radio" ) {
				this._addClass( this.label, "ui-checkboxradio-radio-label" );
			}

			if ( this.options.label && this.options.label !== this.originalLabel ) {
				this._updateLabel();
			} else if ( this.originalLabel ) {
				this.options.label = this.originalLabel;
			}

			this._enhance();

			if ( checked ) {
				this._addClass( this.label, "ui-checkboxradio-checked", "ui-state-active" );
			}

			this._on( {
				change: "_toggleClasses",
				focus: function() {
					this._addClass( this.label, null, "ui-state-focus ui-visual-focus" );
				},
				blur: function() {
					this._removeClass( this.label, null, "ui-state-focus ui-visual-focus" );
				}
			} );
		},

		_readType: function() {
			var nodeName = this.element[ 0 ].nodeName.toLowerCase();
			this.type = this.element[ 0 ].type;
			if ( nodeName !== "input" || !/radio|checkbox/.test( this.type ) ) {
				$.error( "Can't create checkboxradio on element.nodeName=" + nodeName +
					" and element.type=" + this.type );
			}
		},

		// Support jQuery Mobile enhanced option
		_enhance: function() {
			this._updateIcon( this.element[ 0 ].checked );
		},

		widget: function() {
			return this.label;
		},

		_getRadioGroup: function() {
			var group;
			var name = this.element[ 0 ].name;
			var nameSelector = "input[name='" + $.escapeSelector( name ) + "']";

			if ( !name ) {
				return $( [] );
			}

			if ( this.form.length ) {
				group = $( this.form[ 0 ].elements ).filter( nameSelector );
			} else {

				// Not inside a form, check all inputs that also are not inside a form
				group = $( nameSelector ).filter( function() {
					return $( this )._form().length === 0;
				} );
			}

			return group.not( this.element );
		},

		_toggleClasses: function() {
			var checked = this.element[ 0 ].checked;
			this._toggleClass( this.label, "ui-checkboxradio-checked", "ui-state-active", checked );

			if ( this.options.icon && this.type === "checkbox" ) {
				this._toggleClass( this.icon, null, "ui-icon-check ui-state-checked", checked )
				._toggleClass( this.icon, null, "ui-icon-blank", !checked );
			}

			if ( this.type === "radio" ) {
				this._getRadioGroup()
				.each( function() {
					var instance = $( this ).checkboxradio( "instance" );

					if ( instance ) {
						instance._removeClass( instance.label,
							"ui-checkboxradio-checked", "ui-state-active" );
					}
				} );
			}
		},

		_destroy: function() {
			this._unbindFormResetHandler();

			if ( this.icon ) {
				this.icon.remove();
				this.iconSpace.remove();
			}
		},

		_setOption: function( key, value ) {

			// We don't allow the value to be set to nothing
			if ( key === "label" && !value ) {
				return;
			}

			this._super( key, value );

			if ( key === "disabled" ) {
				this._toggleClass( this.label, null, "ui-state-disabled", value );
				this.element[ 0 ].disabled = value;

				// Don't refresh when setting disabled
				return;
			}
			this.refresh();
		},

		_updateIcon: function( checked ) {
			var toAdd = "ui-icon ui-icon-background ";

			if ( this.options.icon ) {
				if ( !this.icon ) {
					this.icon = $( "<span>" );
					this.iconSpace = $( "<span> </span>" );
					this._addClass( this.iconSpace, "ui-checkboxradio-icon-space" );
				}

				if ( this.type === "checkbox" ) {
					toAdd += checked ? "ui-icon-check ui-state-checked" : "ui-icon-blank";
					this._removeClass( this.icon, null, checked ? "ui-icon-blank" : "ui-icon-check" );
				} else {
					toAdd += "ui-icon-blank";
				}
				this._addClass( this.icon, "ui-checkboxradio-icon", toAdd );
				if ( !checked ) {
					this._removeClass( this.icon, null, "ui-icon-check ui-state-checked" );
				}
				this.icon.prependTo( this.label ).after( this.iconSpace );
			} else if ( this.icon !== undefined ) {
				this.icon.remove();
				this.iconSpace.remove();
				delete this.icon;
			}
		},

		_updateLabel: function() {

			// Remove the contents of the label ( minus the icon, icon space, and input )
			var contents = this.label.contents().not( this.element[ 0 ] );
			if ( this.icon ) {
				contents = contents.not( this.icon[ 0 ] );
			}
			if ( this.iconSpace ) {
				contents = contents.not( this.iconSpace[ 0 ] );
			}
			contents.remove();

			this.label.append( this.options.label );
		},

		refresh: function() {
			var checked = this.element[ 0 ].checked,
				isDisabled = this.element[ 0 ].disabled;

			this._updateIcon( checked );
			this._toggleClass( this.label, "ui-checkboxradio-checked", "ui-state-active", checked );
			if ( this.options.label !== null ) {
				this._updateLabel();
			}

			if ( isDisabled !== this.options.disabled ) {
				this._setOptions( { "disabled": isDisabled } );
			}
		}

	} ] );

	var widgetsCheckboxradio = $.ui.checkboxradio;


	/*!
 * jQuery UI Button 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Button
//>>group: Widgets
//>>description: Enhances a form with themeable buttons.
//>>docs: http://api.jqueryui.com/button/
//>>demos: http://jqueryui.com/button/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/button.css
//>>css.theme: ../../themes/base/theme.css


	$.widget( "ui.button", {
		version: "1.13.0",
		defaultElement: "<button>",
		options: {
			classes: {
				"ui-button": "ui-corner-all"
			},
			disabled: null,
			icon: null,
			iconPosition: "beginning",
			label: null,
			showLabel: true
		},

		_getCreateOptions: function() {
			var disabled,

				// This is to support cases like in jQuery Mobile where the base widget does have
				// an implementation of _getCreateOptions
				options = this._super() || {};

			this.isInput = this.element.is( "input" );

			disabled = this.element[ 0 ].disabled;
			if ( disabled != null ) {
				options.disabled = disabled;
			}

			this.originalLabel = this.isInput ? this.element.val() : this.element.html();
			if ( this.originalLabel ) {
				options.label = this.originalLabel;
			}

			return options;
		},

		_create: function() {
			if ( !this.option.showLabel & !this.options.icon ) {
				this.options.showLabel = true;
			}

			// We have to check the option again here even though we did in _getCreateOptions,
			// because null may have been passed on init which would override what was set in
			// _getCreateOptions
			if ( this.options.disabled == null ) {
				this.options.disabled = this.element[ 0 ].disabled || false;
			}

			this.hasTitle = !!this.element.attr( "title" );

			// Check to see if the label needs to be set or if its already correct
			if ( this.options.label && this.options.label !== this.originalLabel ) {
				if ( this.isInput ) {
					this.element.val( this.options.label );
				} else {
					this.element.html( this.options.label );
				}
			}
			this._addClass( "ui-button", "ui-widget" );
			this._setOption( "disabled", this.options.disabled );
			this._enhance();

			if ( this.element.is( "a" ) ) {
				this._on( {
					"keyup": function( event ) {
						if ( event.keyCode === $.ui.keyCode.SPACE ) {
							event.preventDefault();

							// Support: PhantomJS <= 1.9, IE 8 Only
							// If a native click is available use it so we actually cause navigation
							// otherwise just trigger a click event
							if ( this.element[ 0 ].click ) {
								this.element[ 0 ].click();
							} else {
								this.element.trigger( "click" );
							}
						}
					}
				} );
			}
		},

		_enhance: function() {
			if ( !this.element.is( "button" ) ) {
				this.element.attr( "role", "button" );
			}

			if ( this.options.icon ) {
				this._updateIcon( "icon", this.options.icon );
				this._updateTooltip();
			}
		},

		_updateTooltip: function() {
			this.title = this.element.attr( "title" );

			if ( !this.options.showLabel && !this.title ) {
				this.element.attr( "title", this.options.label );
			}
		},

		_updateIcon: function( option, value ) {
			var icon = option !== "iconPosition",
				position = icon ? this.options.iconPosition : value,
				displayBlock = position === "top" || position === "bottom";

			// Create icon
			if ( !this.icon ) {
				this.icon = $( "<span>" );

				this._addClass( this.icon, "ui-button-icon", "ui-icon" );

				if ( !this.options.showLabel ) {
					this._addClass( "ui-button-icon-only" );
				}
			} else if ( icon ) {

				// If we are updating the icon remove the old icon class
				this._removeClass( this.icon, null, this.options.icon );
			}

			// If we are updating the icon add the new icon class
			if ( icon ) {
				this._addClass( this.icon, null, value );
			}

			this._attachIcon( position );

			// If the icon is on top or bottom we need to add the ui-widget-icon-block class and remove
			// the iconSpace if there is one.
			if ( displayBlock ) {
				this._addClass( this.icon, null, "ui-widget-icon-block" );
				if ( this.iconSpace ) {
					this.iconSpace.remove();
				}
			} else {

				// Position is beginning or end so remove the ui-widget-icon-block class and add the
				// space if it does not exist
				if ( !this.iconSpace ) {
					this.iconSpace = $( "<span> </span>" );
					this._addClass( this.iconSpace, "ui-button-icon-space" );
				}
				this._removeClass( this.icon, null, "ui-wiget-icon-block" );
				this._attachIconSpace( position );
			}
		},

		_destroy: function() {
			this.element.removeAttr( "role" );

			if ( this.icon ) {
				this.icon.remove();
			}
			if ( this.iconSpace ) {
				this.iconSpace.remove();
			}
			if ( !this.hasTitle ) {
				this.element.removeAttr( "title" );
			}
		},

		_attachIconSpace: function( iconPosition ) {
			this.icon[ /^(?:end|bottom)/.test( iconPosition ) ? "before" : "after" ]( this.iconSpace );
		},

		_attachIcon: function( iconPosition ) {
			this.element[ /^(?:end|bottom)/.test( iconPosition ) ? "append" : "prepend" ]( this.icon );
		},

		_setOptions: function( options ) {
			var newShowLabel = options.showLabel === undefined ?
					this.options.showLabel :
					options.showLabel,
				newIcon = options.icon === undefined ? this.options.icon : options.icon;

			if ( !newShowLabel && !newIcon ) {
				options.showLabel = true;
			}
			this._super( options );
		},

		_setOption: function( key, value ) {
			if ( key === "icon" ) {
				if ( value ) {
					this._updateIcon( key, value );
				} else if ( this.icon ) {
					this.icon.remove();
					if ( this.iconSpace ) {
						this.iconSpace.remove();
					}
				}
			}

			if ( key === "iconPosition" ) {
				this._updateIcon( key, value );
			}

			// Make sure we can't end up with a button that has neither text nor icon
			if ( key === "showLabel" ) {
				this._toggleClass( "ui-button-icon-only", null, !value );
				this._updateTooltip();
			}

			if ( key === "label" ) {
				if ( this.isInput ) {
					this.element.val( value );
				} else {

					// If there is an icon, append it, else nothing then append the value
					// this avoids removal of the icon when setting label text
					this.element.html( value );
					if ( this.icon ) {
						this._attachIcon( this.options.iconPosition );
						this._attachIconSpace( this.options.iconPosition );
					}
				}
			}

			this._super( key, value );

			if ( key === "disabled" ) {
				this._toggleClass( null, "ui-state-disabled", value );
				this.element[ 0 ].disabled = value;
				if ( value ) {
					this.element.trigger( "blur" );
				}
			}
		},

		refresh: function() {

			// Make sure to only check disabled if its an element that supports this otherwise
			// check for the disabled class to determine state
			var isDisabled = this.element.is( "input, button" ) ?
				this.element[ 0 ].disabled : this.element.hasClass( "ui-button-disabled" );

			if ( isDisabled !== this.options.disabled ) {
				this._setOptions( { disabled: isDisabled } );
			}

			this._updateTooltip();
		}
	} );

// DEPRECATED
	if ( $.uiBackCompat !== false ) {

		// Text and Icons options
		$.widget( "ui.button", $.ui.button, {
			options: {
				text: true,
				icons: {
					primary: null,
					secondary: null
				}
			},

			_create: function() {
				if ( this.options.showLabel && !this.options.text ) {
					this.options.showLabel = this.options.text;
				}
				if ( !this.options.showLabel && this.options.text ) {
					this.options.text = this.options.showLabel;
				}
				if ( !this.options.icon && ( this.options.icons.primary ||
					this.options.icons.secondary ) ) {
					if ( this.options.icons.primary ) {
						this.options.icon = this.options.icons.primary;
					} else {
						this.options.icon = this.options.icons.secondary;
						this.options.iconPosition = "end";
					}
				} else if ( this.options.icon ) {
					this.options.icons.primary = this.options.icon;
				}
				this._super();
			},

			_setOption: function( key, value ) {
				if ( key === "text" ) {
					this._super( "showLabel", value );
					return;
				}
				if ( key === "showLabel" ) {
					this.options.text = value;
				}
				if ( key === "icon" ) {
					this.options.icons.primary = value;
				}
				if ( key === "icons" ) {
					if ( value.primary ) {
						this._super( "icon", value.primary );
						this._super( "iconPosition", "beginning" );
					} else if ( value.secondary ) {
						this._super( "icon", value.secondary );
						this._super( "iconPosition", "end" );
					}
				}
				this._superApply( arguments );
			}
		} );

		$.fn.button = ( function( orig ) {
			return function( options ) {
				var isMethodCall = typeof options === "string";
				var args = Array.prototype.slice.call( arguments, 1 );
				var returnValue = this;

				if ( isMethodCall ) {

					// If this is an empty collection, we need to have the instance method
					// return undefined instead of the jQuery instance
					if ( !this.length && options === "instance" ) {
						returnValue = undefined;
					} else {
						this.each( function() {
							var methodValue;
							var type = $( this ).attr( "type" );
							var name = type !== "checkbox" && type !== "radio" ?
								"button" :
								"checkboxradio";
							var instance = $.data( this, "ui-" + name );

							if ( options === "instance" ) {
								returnValue = instance;
								return false;
							}

							if ( !instance ) {
								return $.error( "cannot call methods on button" +
									" prior to initialization; " +
									"attempted to call method '" + options + "'" );
							}

							if ( typeof instance[ options ] !== "function" ||
								options.charAt( 0 ) === "_" ) {
								return $.error( "no such method '" + options + "' for button" +
									" widget instance" );
							}

							methodValue = instance[ options ].apply( instance, args );

							if ( methodValue !== instance && methodValue !== undefined ) {
								returnValue = methodValue && methodValue.jquery ?
									returnValue.pushStack( methodValue.get() ) :
									methodValue;
								return false;
							}
						} );
					}
				} else {

					// Allow multiple hashes to be passed on init
					if ( args.length ) {
						options = $.widget.extend.apply( null, [ options ].concat( args ) );
					}

					this.each( function() {
						var type = $( this ).attr( "type" );
						var name = type !== "checkbox" && type !== "radio" ? "button" : "checkboxradio";
						var instance = $.data( this, "ui-" + name );

						if ( instance ) {
							instance.option( options || {} );
							if ( instance._init ) {
								instance._init();
							}
						} else {
							if ( name === "button" ) {
								orig.call( $( this ), options );
								return;
							}

							$( this ).checkboxradio( $.extend( { icon: false }, options ) );
						}
					} );
				}

				return returnValue;
			};
		} )( $.fn.button );

		$.fn.buttonset = function() {
			if ( !$.ui.controlgroup ) {
				$.error( "Controlgroup widget missing" );
			}
			if ( arguments[ 0 ] === "option" && arguments[ 1 ] === "items" && arguments[ 2 ] ) {
				return this.controlgroup.apply( this,
					[ arguments[ 0 ], "items.button", arguments[ 2 ] ] );
			}
			if ( arguments[ 0 ] === "option" && arguments[ 1 ] === "items" ) {
				return this.controlgroup.apply( this, [ arguments[ 0 ], "items.button" ] );
			}
			if ( typeof arguments[ 0 ] === "object" && arguments[ 0 ].items ) {
				arguments[ 0 ].items = {
					button: arguments[ 0 ].items
				};
			}
			return this.controlgroup.apply( this, arguments );
		};
	}

	var widgetsButton = $.ui.button;


	/* eslint-disable max-len, camelcase */
	/*!
 * jQuery UI Datepicker 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Datepicker
//>>group: Widgets
//>>description: Displays a calendar from an input or inline for selecting dates.
//>>docs: http://api.jqueryui.com/datepicker/
//>>demos: http://jqueryui.com/datepicker/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/datepicker.css
//>>css.theme: ../../themes/base/theme.css


	$.extend( $.ui, { datepicker: { version: "1.13.0" } } );

	var datepicker_instActive;

	function datepicker_getZindex( elem ) {
		var position, value;
		while ( elem.length && elem[ 0 ] !== document ) {

			// Ignore z-index if position is set to a value where z-index is ignored by the browser
			// This makes behavior of this function consistent across browsers
			// WebKit always returns auto if the element is positioned
			position = elem.css( "position" );
			if ( position === "absolute" || position === "relative" || position === "fixed" ) {

				// IE returns 0 when zIndex is not specified
				// other browsers return a string
				// we ignore the case of nested elements with an explicit value of 0
				// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
				value = parseInt( elem.css( "zIndex" ), 10 );
				if ( !isNaN( value ) && value !== 0 ) {
					return value;
				}
			}
			elem = elem.parent();
		}

		return 0;
	}

	/* Date picker manager.
   Use the singleton instance of this class, $.datepicker, to interact with the date picker.
   Settings for (groups of) date pickers are maintained in an instance object,
   allowing multiple different settings on the same page. */

	function Datepicker() {
		this._curInst = null; // The current instance in use
		this._keyEvent = false; // If the last event was a key event
		this._disabledInputs = []; // List of date picker inputs that have been disabled
		this._datepickerShowing = false; // True if the popup picker is showing , false if not
		this._inDialog = false; // True if showing within a "dialog", false if not
		this._mainDivId = "ui-datepicker-div"; // The ID of the main datepicker division
		this._inlineClass = "ui-datepicker-inline"; // The name of the inline marker class
		this._appendClass = "ui-datepicker-append"; // The name of the append marker class
		this._triggerClass = "ui-datepicker-trigger"; // The name of the trigger marker class
		this._dialogClass = "ui-datepicker-dialog"; // The name of the dialog marker class
		this._disableClass = "ui-datepicker-disabled"; // The name of the disabled covering marker class
		this._unselectableClass = "ui-datepicker-unselectable"; // The name of the unselectable cell marker class
		this._currentClass = "ui-datepicker-current-day"; // The name of the current day marker class
		this._dayOverClass = "ui-datepicker-days-cell-over"; // The name of the day hover marker class
		this.regional = []; // Available regional settings, indexed by language code
		this.regional[ "" ] = { // Default regional settings
			closeText: "Done", // Display text for close link
			prevText: "Prev", // Display text for previous month link
			nextText: "Next", // Display text for next month link
			currentText: "Today", // Display text for current month link
			monthNames: [ "January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December" ], // Names of months for drop-down and formatting
			monthNamesShort: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ], // For formatting
			dayNames: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ], // For formatting
			dayNamesShort: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ], // For formatting
			dayNamesMin: [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ], // Column headings for days starting at Sunday
			weekHeader: "Wk", // Column header for week of the year
			dateFormat: "mm/dd/yy", // See format options on parseDate
			firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
			isRTL: false, // True if right-to-left language, false if left-to-right
			showMonthAfterYear: false, // True if the year select precedes month, false for month then year
			yearSuffix: "", // Additional text to append to the year in the month headers,
			selectMonthLabel: "Select month", // Invisible label for month selector
			selectYearLabel: "Select year" // Invisible label for year selector
		};
		this._defaults = { // Global defaults for all the date picker instances
			showOn: "focus", // "focus" for popup on focus,
			// "button" for trigger button, or "both" for either
			showAnim: "fadeIn", // Name of jQuery animation for popup
			showOptions: {}, // Options for enhanced animations
			defaultDate: null, // Used when field is blank: actual date,
			// +/-number for offset from today, null for today
			appendText: "", // Display text following the input box, e.g. showing the format
			buttonText: "...", // Text for trigger button
			buttonImage: "", // URL for trigger button image
			buttonImageOnly: false, // True if the image appears alone, false if it appears on a button
			hideIfNoPrevNext: false, // True to hide next/previous month links
			// if not applicable, false to just disable them
			navigationAsDateFormat: false, // True if date formatting applied to prev/today/next links
			gotoCurrent: false, // True if today link goes back to current selection instead
			changeMonth: false, // True if month can be selected directly, false if only prev/next
			changeYear: false, // True if year can be selected directly, false if only prev/next
			yearRange: "c-10:c+10", // Range of years to display in drop-down,
			// either relative to today's year (-nn:+nn), relative to currently displayed year
			// (c-nn:c+nn), absolute (nnnn:nnnn), or a combination of the above (nnnn:-n)
			showOtherMonths: false, // True to show dates in other months, false to leave blank
			selectOtherMonths: false, // True to allow selection of dates in other months, false for unselectable
			showWeek: false, // True to show week of the year, false to not show it
			calculateWeek: this.iso8601Week, // How to calculate the week of the year,
			// takes a Date and returns the number of the week for it
			shortYearCutoff: "+10", // Short year values < this are in the current century,
			// > this are in the previous century,
			// string value starting with "+" for current year + value
			minDate: null, // The earliest selectable date, or null for no limit
			maxDate: null, // The latest selectable date, or null for no limit
			duration: "fast", // Duration of display/closure
			beforeShowDay: null, // Function that takes a date and returns an array with
			// [0] = true if selectable, false if not, [1] = custom CSS class name(s) or "",
			// [2] = cell title (optional), e.g. $.datepicker.noWeekends
			beforeShow: null, // Function that takes an input field and
			// returns a set of custom settings for the date picker
			onSelect: null, // Define a callback function when a date is selected
			onChangeMonthYear: null, // Define a callback function when the month or year is changed
			onClose: null, // Define a callback function when the datepicker is closed
			onUpdateDatepicker: null, // Define a callback function when the datepicker is updated
			numberOfMonths: 1, // Number of months to show at a time
			showCurrentAtPos: 0, // The position in multipe months at which to show the current month (starting at 0)
			stepMonths: 1, // Number of months to step back/forward
			stepBigMonths: 12, // Number of months to step back/forward for the big links
			altField: "", // Selector for an alternate field to store selected dates into
			altFormat: "", // The date format to use for the alternate field
			constrainInput: true, // The input is constrained by the current date format
			showButtonPanel: false, // True to show button panel, false to not show it
			autoSize: false, // True to size the input for the date format, false to leave as is
			disabled: false // The initial disabled state
		};
		$.extend( this._defaults, this.regional[ "" ] );
		this.regional.en = $.extend( true, {}, this.regional[ "" ] );
		this.regional[ "en-US" ] = $.extend( true, {}, this.regional.en );
		this.dpDiv = datepicker_bindHover( $( "<div id='" + this._mainDivId + "' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>" ) );
	}

	$.extend( Datepicker.prototype, {

		/* Class name added to elements to indicate already configured with a date picker. */
		markerClassName: "hasDatepicker",

		//Keep track of the maximum number of rows displayed (see #7043)
		maxRows: 4,

		// TODO rename to "widget" when switching to widget factory
		_widgetDatepicker: function() {
			return this.dpDiv;
		},

		/* Override the default settings for all instances of the date picker.
	 * @param  settings  object - the new settings to use as defaults (anonymous object)
	 * @return the manager object
	 */
		setDefaults: function( settings ) {
			datepicker_extendRemove( this._defaults, settings || {} );
			return this;
		},

		/* Attach the date picker to a jQuery selection.
	 * @param  target	element - the target input field or division or span
	 * @param  settings  object - the new settings to use for this date picker instance (anonymous)
	 */
		_attachDatepicker: function( target, settings ) {
			var nodeName, inline, inst;
			nodeName = target.nodeName.toLowerCase();
			inline = ( nodeName === "div" || nodeName === "span" );
			if ( !target.id ) {
				this.uuid += 1;
				target.id = "dp" + this.uuid;
			}
			inst = this._newInst( $( target ), inline );
			inst.settings = $.extend( {}, settings || {} );
			if ( nodeName === "input" ) {
				this._connectDatepicker( target, inst );
			} else if ( inline ) {
				this._inlineDatepicker( target, inst );
			}
		},

		/* Create a new instance object. */
		_newInst: function( target, inline ) {
			var id = target[ 0 ].id.replace( /([^A-Za-z0-9_\-])/g, "\\\\$1" ); // escape jQuery meta chars
			return { id: id, input: target, // associated target
				selectedDay: 0, selectedMonth: 0, selectedYear: 0, // current selection
				drawMonth: 0, drawYear: 0, // month being drawn
				inline: inline, // is datepicker inline or not
				dpDiv: ( !inline ? this.dpDiv : // presentation div
					datepicker_bindHover( $( "<div class='" + this._inlineClass + " ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>" ) ) ) };
		},

		/* Attach the date picker to an input field. */
		_connectDatepicker: function( target, inst ) {
			var input = $( target );
			inst.append = $( [] );
			inst.trigger = $( [] );
			if ( input.hasClass( this.markerClassName ) ) {
				return;
			}
			this._attachments( input, inst );
			input.addClass( this.markerClassName ).on( "keydown", this._doKeyDown ).
			on( "keypress", this._doKeyPress ).on( "keyup", this._doKeyUp );
			this._autoSize( inst );
			$.data( target, "datepicker", inst );

			//If disabled option is true, disable the datepicker once it has been attached to the input (see ticket #5665)
			if ( inst.settings.disabled ) {
				this._disableDatepicker( target );
			}
		},

		/* Make attachments based on settings. */
		_attachments: function( input, inst ) {
			var showOn, buttonText, buttonImage,
				appendText = this._get( inst, "appendText" ),
				isRTL = this._get( inst, "isRTL" );

			if ( inst.append ) {
				inst.append.remove();
			}
			if ( appendText ) {
				inst.append = $( "<span>" )
				.addClass( this._appendClass )
				.text( appendText );
				input[ isRTL ? "before" : "after" ]( inst.append );
			}

			input.off( "focus", this._showDatepicker );

			if ( inst.trigger ) {
				inst.trigger.remove();
			}

			showOn = this._get( inst, "showOn" );
			if ( showOn === "focus" || showOn === "both" ) { // pop-up date picker when in the marked field
				input.on( "focus", this._showDatepicker );
			}
			if ( showOn === "button" || showOn === "both" ) { // pop-up date picker when button clicked
				buttonText = this._get( inst, "buttonText" );
				buttonImage = this._get( inst, "buttonImage" );

				if ( this._get( inst, "buttonImageOnly" ) ) {
					inst.trigger = $( "<img>" )
					.addClass( this._triggerClass )
					.attr( {
						src: buttonImage,
						alt: buttonText,
						title: buttonText
					} );
				} else {
					inst.trigger = $( "<button type='button'>" )
					.addClass( this._triggerClass );
					if ( buttonImage ) {
						inst.trigger.html(
							$( "<img>" )
							.attr( {
								src: buttonImage,
								alt: buttonText,
								title: buttonText
							} )
						);
					} else {
						inst.trigger.text( buttonText );
					}
				}

				input[ isRTL ? "before" : "after" ]( inst.trigger );
				inst.trigger.on( "click", function() {
					if ( $.datepicker._datepickerShowing && $.datepicker._lastInput === input[ 0 ] ) {
						$.datepicker._hideDatepicker();
					} else if ( $.datepicker._datepickerShowing && $.datepicker._lastInput !== input[ 0 ] ) {
						$.datepicker._hideDatepicker();
						$.datepicker._showDatepicker( input[ 0 ] );
					} else {
						$.datepicker._showDatepicker( input[ 0 ] );
					}
					return false;
				} );
			}
		},

		/* Apply the maximum length for the date format. */
		_autoSize: function( inst ) {
			if ( this._get( inst, "autoSize" ) && !inst.inline ) {
				var findMax, max, maxI, i,
					date = new Date( 2009, 12 - 1, 20 ), // Ensure double digits
					dateFormat = this._get( inst, "dateFormat" );

				if ( dateFormat.match( /[DM]/ ) ) {
					findMax = function( names ) {
						max = 0;
						maxI = 0;
						for ( i = 0; i < names.length; i++ ) {
							if ( names[ i ].length > max ) {
								max = names[ i ].length;
								maxI = i;
							}
						}
						return maxI;
					};
					date.setMonth( findMax( this._get( inst, ( dateFormat.match( /MM/ ) ?
						"monthNames" : "monthNamesShort" ) ) ) );
					date.setDate( findMax( this._get( inst, ( dateFormat.match( /DD/ ) ?
						"dayNames" : "dayNamesShort" ) ) ) + 20 - date.getDay() );
				}
				inst.input.attr( "size", this._formatDate( inst, date ).length );
			}
		},

		/* Attach an inline date picker to a div. */
		_inlineDatepicker: function( target, inst ) {
			var divSpan = $( target );
			if ( divSpan.hasClass( this.markerClassName ) ) {
				return;
			}
			divSpan.addClass( this.markerClassName ).append( inst.dpDiv );
			$.data( target, "datepicker", inst );
			this._setDate( inst, this._getDefaultDate( inst ), true );
			this._updateDatepicker( inst );
			this._updateAlternate( inst );

			//If disabled option is true, disable the datepicker before showing it (see ticket #5665)
			if ( inst.settings.disabled ) {
				this._disableDatepicker( target );
			}

			// Set display:block in place of inst.dpDiv.show() which won't work on disconnected elements
			// http://bugs.jqueryui.com/ticket/7552 - A Datepicker created on a detached div has zero height
			inst.dpDiv.css( "display", "block" );
		},

		/* Pop-up the date picker in a "dialog" box.
	 * @param  input element - ignored
	 * @param  date	string or Date - the initial date to display
	 * @param  onSelect  function - the function to call when a date is selected
	 * @param  settings  object - update the dialog date picker instance's settings (anonymous object)
	 * @param  pos int[2] - coordinates for the dialog's position within the screen or
	 *					event - with x/y coordinates or
	 *					leave empty for default (screen centre)
	 * @return the manager object
	 */
		_dialogDatepicker: function( input, date, onSelect, settings, pos ) {
			var id, browserWidth, browserHeight, scrollX, scrollY,
				inst = this._dialogInst; // internal instance

			if ( !inst ) {
				this.uuid += 1;
				id = "dp" + this.uuid;
				this._dialogInput = $( "<input type='text' id='" + id +
					"' style='position: absolute; top: -100px; width: 0px;'/>" );
				this._dialogInput.on( "keydown", this._doKeyDown );
				$( "body" ).append( this._dialogInput );
				inst = this._dialogInst = this._newInst( this._dialogInput, false );
				inst.settings = {};
				$.data( this._dialogInput[ 0 ], "datepicker", inst );
			}
			datepicker_extendRemove( inst.settings, settings || {} );
			date = ( date && date.constructor === Date ? this._formatDate( inst, date ) : date );
			this._dialogInput.val( date );

			this._pos = ( pos ? ( pos.length ? pos : [ pos.pageX, pos.pageY ] ) : null );
			if ( !this._pos ) {
				browserWidth = document.documentElement.clientWidth;
				browserHeight = document.documentElement.clientHeight;
				scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
				scrollY = document.documentElement.scrollTop || document.body.scrollTop;
				this._pos = // should use actual width/height below
					[ ( browserWidth / 2 ) - 100 + scrollX, ( browserHeight / 2 ) - 150 + scrollY ];
			}

			// Move input on screen for focus, but hidden behind dialog
			this._dialogInput.css( "left", ( this._pos[ 0 ] + 20 ) + "px" ).css( "top", this._pos[ 1 ] + "px" );
			inst.settings.onSelect = onSelect;
			this._inDialog = true;
			this.dpDiv.addClass( this._dialogClass );
			this._showDatepicker( this._dialogInput[ 0 ] );
			if ( $.blockUI ) {
				$.blockUI( this.dpDiv );
			}
			$.data( this._dialogInput[ 0 ], "datepicker", inst );
			return this;
		},

		/* Detach a datepicker from its control.
	 * @param  target	element - the target input field or division or span
	 */
		_destroyDatepicker: function( target ) {
			var nodeName,
				$target = $( target ),
				inst = $.data( target, "datepicker" );

			if ( !$target.hasClass( this.markerClassName ) ) {
				return;
			}

			nodeName = target.nodeName.toLowerCase();
			$.removeData( target, "datepicker" );
			if ( nodeName === "input" ) {
				inst.append.remove();
				inst.trigger.remove();
				$target.removeClass( this.markerClassName ).
				off( "focus", this._showDatepicker ).
				off( "keydown", this._doKeyDown ).
				off( "keypress", this._doKeyPress ).
				off( "keyup", this._doKeyUp );
			} else if ( nodeName === "div" || nodeName === "span" ) {
				$target.removeClass( this.markerClassName ).empty();
			}

			if ( datepicker_instActive === inst ) {
				datepicker_instActive = null;
				this._curInst = null;
			}
		},

		/* Enable the date picker to a jQuery selection.
	 * @param  target	element - the target input field or division or span
	 */
		_enableDatepicker: function( target ) {
			var nodeName, inline,
				$target = $( target ),
				inst = $.data( target, "datepicker" );

			if ( !$target.hasClass( this.markerClassName ) ) {
				return;
			}

			nodeName = target.nodeName.toLowerCase();
			if ( nodeName === "input" ) {
				target.disabled = false;
				inst.trigger.filter( "button" ).
				each( function() {
					this.disabled = false;
				} ).end().
				filter( "img" ).css( { opacity: "1.0", cursor: "" } );
			} else if ( nodeName === "div" || nodeName === "span" ) {
				inline = $target.children( "." + this._inlineClass );
				inline.children().removeClass( "ui-state-disabled" );
				inline.find( "select.ui-datepicker-month, select.ui-datepicker-year" ).
				prop( "disabled", false );
			}
			this._disabledInputs = $.map( this._disabledInputs,

				// Delete entry
				function( value ) {
					return ( value === target ? null : value );
				} );
		},

		/* Disable the date picker to a jQuery selection.
	 * @param  target	element - the target input field or division or span
	 */
		_disableDatepicker: function( target ) {
			var nodeName, inline,
				$target = $( target ),
				inst = $.data( target, "datepicker" );

			if ( !$target.hasClass( this.markerClassName ) ) {
				return;
			}

			nodeName = target.nodeName.toLowerCase();
			if ( nodeName === "input" ) {
				target.disabled = true;
				inst.trigger.filter( "button" ).
				each( function() {
					this.disabled = true;
				} ).end().
				filter( "img" ).css( { opacity: "0.5", cursor: "default" } );
			} else if ( nodeName === "div" || nodeName === "span" ) {
				inline = $target.children( "." + this._inlineClass );
				inline.children().addClass( "ui-state-disabled" );
				inline.find( "select.ui-datepicker-month, select.ui-datepicker-year" ).
				prop( "disabled", true );
			}
			this._disabledInputs = $.map( this._disabledInputs,

				// Delete entry
				function( value ) {
					return ( value === target ? null : value );
				} );
			this._disabledInputs[ this._disabledInputs.length ] = target;
		},

		/* Is the first field in a jQuery collection disabled as a datepicker?
	 * @param  target	element - the target input field or division or span
	 * @return boolean - true if disabled, false if enabled
	 */
		_isDisabledDatepicker: function( target ) {
			if ( !target ) {
				return false;
			}
			for ( var i = 0; i < this._disabledInputs.length; i++ ) {
				if ( this._disabledInputs[ i ] === target ) {
					return true;
				}
			}
			return false;
		},

		/* Retrieve the instance data for the target control.
	 * @param  target  element - the target input field or division or span
	 * @return  object - the associated instance data
	 * @throws  error if a jQuery problem getting data
	 */
		_getInst: function( target ) {
			try {
				return $.data( target, "datepicker" );
			} catch ( err ) {
				throw "Missing instance data for this datepicker";
			}
		},

		/* Update or retrieve the settings for a date picker attached to an input field or division.
	 * @param  target  element - the target input field or division or span
	 * @param  name	object - the new settings to update or
	 *				string - the name of the setting to change or retrieve,
	 *				when retrieving also "all" for all instance settings or
	 *				"defaults" for all global defaults
	 * @param  value   any - the new value for the setting
	 *				(omit if above is an object or to retrieve a value)
	 */
		_optionDatepicker: function( target, name, value ) {
			var settings, date, minDate, maxDate,
				inst = this._getInst( target );

			if ( arguments.length === 2 && typeof name === "string" ) {
				return ( name === "defaults" ? $.extend( {}, $.datepicker._defaults ) :
					( inst ? ( name === "all" ? $.extend( {}, inst.settings ) :
						this._get( inst, name ) ) : null ) );
			}

			settings = name || {};
			if ( typeof name === "string" ) {
				settings = {};
				settings[ name ] = value;
			}

			if ( inst ) {
				if ( this._curInst === inst ) {
					this._hideDatepicker();
				}

				date = this._getDateDatepicker( target, true );
				minDate = this._getMinMaxDate( inst, "min" );
				maxDate = this._getMinMaxDate( inst, "max" );
				datepicker_extendRemove( inst.settings, settings );

				// reformat the old minDate/maxDate values if dateFormat changes and a new minDate/maxDate isn't provided
				if ( minDate !== null && settings.dateFormat !== undefined && settings.minDate === undefined ) {
					inst.settings.minDate = this._formatDate( inst, minDate );
				}
				if ( maxDate !== null && settings.dateFormat !== undefined && settings.maxDate === undefined ) {
					inst.settings.maxDate = this._formatDate( inst, maxDate );
				}
				if ( "disabled" in settings ) {
					if ( settings.disabled ) {
						this._disableDatepicker( target );
					} else {
						this._enableDatepicker( target );
					}
				}
				this._attachments( $( target ), inst );
				this._autoSize( inst );
				this._setDate( inst, date );
				this._updateAlternate( inst );
				this._updateDatepicker( inst );
			}
		},

		// Change method deprecated
		_changeDatepicker: function( target, name, value ) {
			this._optionDatepicker( target, name, value );
		},

		/* Redraw the date picker attached to an input field or division.
	 * @param  target  element - the target input field or division or span
	 */
		_refreshDatepicker: function( target ) {
			var inst = this._getInst( target );
			if ( inst ) {
				this._updateDatepicker( inst );
			}
		},

		/* Set the dates for a jQuery selection.
	 * @param  target element - the target input field or division or span
	 * @param  date	Date - the new date
	 */
		_setDateDatepicker: function( target, date ) {
			var inst = this._getInst( target );
			if ( inst ) {
				this._setDate( inst, date );
				this._updateDatepicker( inst );
				this._updateAlternate( inst );
			}
		},

		/* Get the date(s) for the first entry in a jQuery selection.
	 * @param  target element - the target input field or division or span
	 * @param  noDefault boolean - true if no default date is to be used
	 * @return Date - the current date
	 */
		_getDateDatepicker: function( target, noDefault ) {
			var inst = this._getInst( target );
			if ( inst && !inst.inline ) {
				this._setDateFromField( inst, noDefault );
			}
			return ( inst ? this._getDate( inst ) : null );
		},

		/* Handle keystrokes. */
		_doKeyDown: function( event ) {
			var onSelect, dateStr, sel,
				inst = $.datepicker._getInst( event.target ),
				handled = true,
				isRTL = inst.dpDiv.is( ".ui-datepicker-rtl" );

			inst._keyEvent = true;
			if ( $.datepicker._datepickerShowing ) {
				switch ( event.keyCode ) {
					case 9: $.datepicker._hideDatepicker();
						handled = false;
						break; // hide on tab out
					case 13: sel = $( "td." + $.datepicker._dayOverClass + ":not(." +
						$.datepicker._currentClass + ")", inst.dpDiv );
						if ( sel[ 0 ] ) {
							$.datepicker._selectDay( event.target, inst.selectedMonth, inst.selectedYear, sel[ 0 ] );
						}

						onSelect = $.datepicker._get( inst, "onSelect" );
						if ( onSelect ) {
							dateStr = $.datepicker._formatDate( inst );

							// Trigger custom callback
							onSelect.apply( ( inst.input ? inst.input[ 0 ] : null ), [ dateStr, inst ] );
						} else {
							$.datepicker._hideDatepicker();
						}

						return false; // don't submit the form
					case 27: $.datepicker._hideDatepicker();
						break; // hide on escape
					case 33: $.datepicker._adjustDate( event.target, ( event.ctrlKey ?
						-$.datepicker._get( inst, "stepBigMonths" ) :
						-$.datepicker._get( inst, "stepMonths" ) ), "M" );
						break; // previous month/year on page up/+ ctrl
					case 34: $.datepicker._adjustDate( event.target, ( event.ctrlKey ?
						+$.datepicker._get( inst, "stepBigMonths" ) :
						+$.datepicker._get( inst, "stepMonths" ) ), "M" );
						break; // next month/year on page down/+ ctrl
					case 35: if ( event.ctrlKey || event.metaKey ) {
						$.datepicker._clearDate( event.target );
					}
						handled = event.ctrlKey || event.metaKey;
						break; // clear on ctrl or command +end
					case 36: if ( event.ctrlKey || event.metaKey ) {
						$.datepicker._gotoToday( event.target );
					}
						handled = event.ctrlKey || event.metaKey;
						break; // current on ctrl or command +home
					case 37: if ( event.ctrlKey || event.metaKey ) {
						$.datepicker._adjustDate( event.target, ( isRTL ? +1 : -1 ), "D" );
					}
						handled = event.ctrlKey || event.metaKey;

						// -1 day on ctrl or command +left
						if ( event.originalEvent.altKey ) {
							$.datepicker._adjustDate( event.target, ( event.ctrlKey ?
								-$.datepicker._get( inst, "stepBigMonths" ) :
								-$.datepicker._get( inst, "stepMonths" ) ), "M" );
						}

						// next month/year on alt +left on Mac
						break;
					case 38: if ( event.ctrlKey || event.metaKey ) {
						$.datepicker._adjustDate( event.target, -7, "D" );
					}
						handled = event.ctrlKey || event.metaKey;
						break; // -1 week on ctrl or command +up
					case 39: if ( event.ctrlKey || event.metaKey ) {
						$.datepicker._adjustDate( event.target, ( isRTL ? -1 : +1 ), "D" );
					}
						handled = event.ctrlKey || event.metaKey;

						// +1 day on ctrl or command +right
						if ( event.originalEvent.altKey ) {
							$.datepicker._adjustDate( event.target, ( event.ctrlKey ?
								+$.datepicker._get( inst, "stepBigMonths" ) :
								+$.datepicker._get( inst, "stepMonths" ) ), "M" );
						}

						// next month/year on alt +right
						break;
					case 40: if ( event.ctrlKey || event.metaKey ) {
						$.datepicker._adjustDate( event.target, +7, "D" );
					}
						handled = event.ctrlKey || event.metaKey;
						break; // +1 week on ctrl or command +down
					default: handled = false;
				}
			} else if ( event.keyCode === 36 && event.ctrlKey ) { // display the date picker on ctrl+home
				$.datepicker._showDatepicker( this );
			} else {
				handled = false;
			}

			if ( handled ) {
				event.preventDefault();
				event.stopPropagation();
			}
		},

		/* Filter entered characters - based on date format. */
		_doKeyPress: function( event ) {
			var chars, chr,
				inst = $.datepicker._getInst( event.target );

			if ( $.datepicker._get( inst, "constrainInput" ) ) {
				chars = $.datepicker._possibleChars( $.datepicker._get( inst, "dateFormat" ) );
				chr = String.fromCharCode( event.charCode == null ? event.keyCode : event.charCode );
				return event.ctrlKey || event.metaKey || ( chr < " " || !chars || chars.indexOf( chr ) > -1 );
			}
		},

		/* Synchronise manual entry and field/alternate field. */
		_doKeyUp: function( event ) {
			var date,
				inst = $.datepicker._getInst( event.target );

			if ( inst.input.val() !== inst.lastVal ) {
				try {
					date = $.datepicker.parseDate( $.datepicker._get( inst, "dateFormat" ),
						( inst.input ? inst.input.val() : null ),
						$.datepicker._getFormatConfig( inst ) );

					if ( date ) { // only if valid
						$.datepicker._setDateFromField( inst );
						$.datepicker._updateAlternate( inst );
						$.datepicker._updateDatepicker( inst );
					}
				} catch ( err ) {
				}
			}
			return true;
		},

		/* Pop-up the date picker for a given input field.
	 * If false returned from beforeShow event handler do not show.
	 * @param  input  element - the input field attached to the date picker or
	 *					event - if triggered by focus
	 */
		_showDatepicker: function( input ) {
			input = input.target || input;
			if ( input.nodeName.toLowerCase() !== "input" ) { // find from button/image trigger
				input = $( "input", input.parentNode )[ 0 ];
			}

			if ( $.datepicker._isDisabledDatepicker( input ) || $.datepicker._lastInput === input ) { // already here
				return;
			}

			var inst, beforeShow, beforeShowSettings, isFixed,
				offset, showAnim, duration;

			inst = $.datepicker._getInst( input );
			if ( $.datepicker._curInst && $.datepicker._curInst !== inst ) {
				$.datepicker._curInst.dpDiv.stop( true, true );
				if ( inst && $.datepicker._datepickerShowing ) {
					$.datepicker._hideDatepicker( $.datepicker._curInst.input[ 0 ] );
				}
			}

			beforeShow = $.datepicker._get( inst, "beforeShow" );
			beforeShowSettings = beforeShow ? beforeShow.apply( input, [ input, inst ] ) : {};
			if ( beforeShowSettings === false ) {
				return;
			}
			datepicker_extendRemove( inst.settings, beforeShowSettings );

			inst.lastVal = null;
			$.datepicker._lastInput = input;
			$.datepicker._setDateFromField( inst );

			if ( $.datepicker._inDialog ) { // hide cursor
				input.value = "";
			}
			if ( !$.datepicker._pos ) { // position below input
				$.datepicker._pos = $.datepicker._findPos( input );
				$.datepicker._pos[ 1 ] += input.offsetHeight; // add the height
			}

			isFixed = false;
			$( input ).parents().each( function() {
				isFixed |= $( this ).css( "position" ) === "fixed";
				return !isFixed;
			} );

			offset = { left: $.datepicker._pos[ 0 ], top: $.datepicker._pos[ 1 ] };
			$.datepicker._pos = null;

			//to avoid flashes on Firefox
			inst.dpDiv.empty();

			// determine sizing offscreen
			inst.dpDiv.css( { position: "absolute", display: "block", top: "-1000px" } );
			$.datepicker._updateDatepicker( inst );

			// fix width for dynamic number of date pickers
			// and adjust position before showing
			offset = $.datepicker._checkOffset( inst, offset, isFixed );
			inst.dpDiv.css( { position: ( $.datepicker._inDialog && $.blockUI ?
					"static" : ( isFixed ? "fixed" : "absolute" ) ), display: "none",
				left: offset.left + "px", top: offset.top + "px" } );

			if ( !inst.inline ) {
				showAnim = $.datepicker._get( inst, "showAnim" );
				duration = $.datepicker._get( inst, "duration" );
				inst.dpDiv.css( "z-index", datepicker_getZindex( $( input ) ) + 1 );
				$.datepicker._datepickerShowing = true;

				if ( $.effects && $.effects.effect[ showAnim ] ) {
					inst.dpDiv.show( showAnim, $.datepicker._get( inst, "showOptions" ), duration );
				} else {
					inst.dpDiv[ showAnim || "show" ]( showAnim ? duration : null );
				}

				if ( $.datepicker._shouldFocusInput( inst ) ) {
					inst.input.trigger( "focus" );
				}

				$.datepicker._curInst = inst;
			}
		},

		/* Generate the date picker content. */
		_updateDatepicker: function( inst ) {
			this.maxRows = 4; //Reset the max number of rows being displayed (see #7043)
			datepicker_instActive = inst; // for delegate hover events
			inst.dpDiv.empty().append( this._generateHTML( inst ) );
			this._attachHandlers( inst );

			var origyearshtml,
				numMonths = this._getNumberOfMonths( inst ),
				cols = numMonths[ 1 ],
				width = 17,
				activeCell = inst.dpDiv.find( "." + this._dayOverClass + " a" ),
				onUpdateDatepicker = $.datepicker._get( inst, "onUpdateDatepicker" );

			if ( activeCell.length > 0 ) {
				datepicker_handleMouseover.apply( activeCell.get( 0 ) );
			}

			inst.dpDiv.removeClass( "ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4" ).width( "" );
			if ( cols > 1 ) {
				inst.dpDiv.addClass( "ui-datepicker-multi-" + cols ).css( "width", ( width * cols ) + "em" );
			}
			inst.dpDiv[ ( numMonths[ 0 ] !== 1 || numMonths[ 1 ] !== 1 ? "add" : "remove" ) +
			"Class" ]( "ui-datepicker-multi" );
			inst.dpDiv[ ( this._get( inst, "isRTL" ) ? "add" : "remove" ) +
			"Class" ]( "ui-datepicker-rtl" );

			if ( inst === $.datepicker._curInst && $.datepicker._datepickerShowing && $.datepicker._shouldFocusInput( inst ) ) {
				inst.input.trigger( "focus" );
			}

			// Deffered render of the years select (to avoid flashes on Firefox)
			if ( inst.yearshtml ) {
				origyearshtml = inst.yearshtml;
				setTimeout( function() {

					//assure that inst.yearshtml didn't change.
					if ( origyearshtml === inst.yearshtml && inst.yearshtml ) {
						inst.dpDiv.find( "select.ui-datepicker-year" ).first().replaceWith( inst.yearshtml );
					}
					origyearshtml = inst.yearshtml = null;
				}, 0 );
			}

			if ( onUpdateDatepicker ) {
				onUpdateDatepicker.apply( ( inst.input ? inst.input[ 0 ] : null ), [ inst ] );
			}
		},

		// #6694 - don't focus the input if it's already focused
		// this breaks the change event in IE
		// Support: IE and jQuery <1.9
		_shouldFocusInput: function( inst ) {
			return inst.input && inst.input.is( ":visible" ) && !inst.input.is( ":disabled" ) && !inst.input.is( ":focus" );
		},

		/* Check positioning to remain on screen. */
		_checkOffset: function( inst, offset, isFixed ) {
			var dpWidth = inst.dpDiv.outerWidth(),
				dpHeight = inst.dpDiv.outerHeight(),
				inputWidth = inst.input ? inst.input.outerWidth() : 0,
				inputHeight = inst.input ? inst.input.outerHeight() : 0,
				viewWidth = document.documentElement.clientWidth + ( isFixed ? 0 : $( document ).scrollLeft() ),
				viewHeight = document.documentElement.clientHeight + ( isFixed ? 0 : $( document ).scrollTop() );

			offset.left -= ( this._get( inst, "isRTL" ) ? ( dpWidth - inputWidth ) : 0 );
			offset.left -= ( isFixed && offset.left === inst.input.offset().left ) ? $( document ).scrollLeft() : 0;
			offset.top -= ( isFixed && offset.top === ( inst.input.offset().top + inputHeight ) ) ? $( document ).scrollTop() : 0;

			// Now check if datepicker is showing outside window viewport - move to a better place if so.
			offset.left -= Math.min( offset.left, ( offset.left + dpWidth > viewWidth && viewWidth > dpWidth ) ?
				Math.abs( offset.left + dpWidth - viewWidth ) : 0 );
			offset.top -= Math.min( offset.top, ( offset.top + dpHeight > viewHeight && viewHeight > dpHeight ) ?
				Math.abs( dpHeight + inputHeight ) : 0 );

			return offset;
		},

		/* Find an object's position on the screen. */
		_findPos: function( obj ) {
			var position,
				inst = this._getInst( obj ),
				isRTL = this._get( inst, "isRTL" );

			while ( obj && ( obj.type === "hidden" || obj.nodeType !== 1 || $.expr.pseudos.hidden( obj ) ) ) {
				obj = obj[ isRTL ? "previousSibling" : "nextSibling" ];
			}

			position = $( obj ).offset();
			return [ position.left, position.top ];
		},

		/* Hide the date picker from view.
	 * @param  input  element - the input field attached to the date picker
	 */
		_hideDatepicker: function( input ) {
			var showAnim, duration, postProcess, onClose,
				inst = this._curInst;

			if ( !inst || ( input && inst !== $.data( input, "datepicker" ) ) ) {
				return;
			}

			if ( this._datepickerShowing ) {
				showAnim = this._get( inst, "showAnim" );
				duration = this._get( inst, "duration" );
				postProcess = function() {
					$.datepicker._tidyDialog( inst );
				};

				// DEPRECATED: after BC for 1.8.x $.effects[ showAnim ] is not needed
				if ( $.effects && ( $.effects.effect[ showAnim ] || $.effects[ showAnim ] ) ) {
					inst.dpDiv.hide( showAnim, $.datepicker._get( inst, "showOptions" ), duration, postProcess );
				} else {
					inst.dpDiv[ ( showAnim === "slideDown" ? "slideUp" :
						( showAnim === "fadeIn" ? "fadeOut" : "hide" ) ) ]( ( showAnim ? duration : null ), postProcess );
				}

				if ( !showAnim ) {
					postProcess();
				}
				this._datepickerShowing = false;

				onClose = this._get( inst, "onClose" );
				if ( onClose ) {
					onClose.apply( ( inst.input ? inst.input[ 0 ] : null ), [ ( inst.input ? inst.input.val() : "" ), inst ] );
				}

				this._lastInput = null;
				if ( this._inDialog ) {
					this._dialogInput.css( { position: "absolute", left: "0", top: "-100px" } );
					if ( $.blockUI ) {
						$.unblockUI();
						$( "body" ).append( this.dpDiv );
					}
				}
				this._inDialog = false;
			}
		},

		/* Tidy up after a dialog display. */
		_tidyDialog: function( inst ) {
			inst.dpDiv.removeClass( this._dialogClass ).off( ".ui-datepicker-calendar" );
		},

		/* Close date picker if clicked elsewhere. */
		_checkExternalClick: function( event ) {
			if ( !$.datepicker._curInst ) {
				return;
			}

			var $target = $( event.target ),
				inst = $.datepicker._getInst( $target[ 0 ] );

			if ( ( ( $target[ 0 ].id !== $.datepicker._mainDivId &&
					$target.parents( "#" + $.datepicker._mainDivId ).length === 0 &&
					!$target.hasClass( $.datepicker.markerClassName ) &&
					!$target.closest( "." + $.datepicker._triggerClass ).length &&
					$.datepicker._datepickerShowing && !( $.datepicker._inDialog && $.blockUI ) ) ) ||
				( $target.hasClass( $.datepicker.markerClassName ) && $.datepicker._curInst !== inst ) ) {
				$.datepicker._hideDatepicker();
			}
		},

		/* Adjust one of the date sub-fields. */
		_adjustDate: function( id, offset, period ) {
			var target = $( id ),
				inst = this._getInst( target[ 0 ] );

			if ( this._isDisabledDatepicker( target[ 0 ] ) ) {
				return;
			}
			this._adjustInstDate( inst, offset, period );
			this._updateDatepicker( inst );
		},

		/* Action for current link. */
		_gotoToday: function( id ) {
			var date,
				target = $( id ),
				inst = this._getInst( target[ 0 ] );

			if ( this._get( inst, "gotoCurrent" ) && inst.currentDay ) {
				inst.selectedDay = inst.currentDay;
				inst.drawMonth = inst.selectedMonth = inst.currentMonth;
				inst.drawYear = inst.selectedYear = inst.currentYear;
			} else {
				date = new Date();
				inst.selectedDay = date.getDate();
				inst.drawMonth = inst.selectedMonth = date.getMonth();
				inst.drawYear = inst.selectedYear = date.getFullYear();
			}
			this._notifyChange( inst );
			this._adjustDate( target );
		},

		/* Action for selecting a new month/year. */
		_selectMonthYear: function( id, select, period ) {
			var target = $( id ),
				inst = this._getInst( target[ 0 ] );

			inst[ "selected" + ( period === "M" ? "Month" : "Year" ) ] =
				inst[ "draw" + ( period === "M" ? "Month" : "Year" ) ] =
					parseInt( select.options[ select.selectedIndex ].value, 10 );

			this._notifyChange( inst );
			this._adjustDate( target );
		},

		/* Action for selecting a day. */
		_selectDay: function( id, month, year, td ) {
			var inst,
				target = $( id );

			if ( $( td ).hasClass( this._unselectableClass ) || this._isDisabledDatepicker( target[ 0 ] ) ) {
				return;
			}

			inst = this._getInst( target[ 0 ] );
			inst.selectedDay = inst.currentDay = parseInt( $( "a", td ).attr( "data-date" ) );
			inst.selectedMonth = inst.currentMonth = month;
			inst.selectedYear = inst.currentYear = year;
			this._selectDate( id, this._formatDate( inst,
				inst.currentDay, inst.currentMonth, inst.currentYear ) );
		},

		/* Erase the input field and hide the date picker. */
		_clearDate: function( id ) {
			var target = $( id );
			this._selectDate( target, "" );
		},

		/* Update the input field with the selected date. */
		_selectDate: function( id, dateStr ) {
			var onSelect,
				target = $( id ),
				inst = this._getInst( target[ 0 ] );

			dateStr = ( dateStr != null ? dateStr : this._formatDate( inst ) );
			if ( inst.input ) {
				inst.input.val( dateStr );
			}
			this._updateAlternate( inst );

			onSelect = this._get( inst, "onSelect" );
			if ( onSelect ) {
				onSelect.apply( ( inst.input ? inst.input[ 0 ] : null ), [ dateStr, inst ] );  // trigger custom callback
			} else if ( inst.input ) {
				inst.input.trigger( "change" ); // fire the change event
			}

			if ( inst.inline ) {
				this._updateDatepicker( inst );
			} else {
				this._hideDatepicker();
				this._lastInput = inst.input[ 0 ];
				if ( typeof( inst.input[ 0 ] ) !== "object" ) {
					inst.input.trigger( "focus" ); // restore focus
				}
				this._lastInput = null;
			}
		},

		/* Update any alternate field to synchronise with the main field. */
		_updateAlternate: function( inst ) {
			var altFormat, date, dateStr,
				altField = this._get( inst, "altField" );

			if ( altField ) { // update alternate field too
				altFormat = this._get( inst, "altFormat" ) || this._get( inst, "dateFormat" );
				date = this._getDate( inst );
				dateStr = this.formatDate( altFormat, date, this._getFormatConfig( inst ) );
				$( document ).find( altField ).val( dateStr );
			}
		},

		/* Set as beforeShowDay function to prevent selection of weekends.
	 * @param  date  Date - the date to customise
	 * @return [boolean, string] - is this date selectable?, what is its CSS class?
	 */
		noWeekends: function( date ) {
			var day = date.getDay();
			return [ ( day > 0 && day < 6 ), "" ];
		},

		/* Set as calculateWeek to determine the week of the year based on the ISO 8601 definition.
	 * @param  date  Date - the date to get the week for
	 * @return  number - the number of the week within the year that contains this date
	 */
		iso8601Week: function( date ) {
			var time,
				checkDate = new Date( date.getTime() );

			// Find Thursday of this week starting on Monday
			checkDate.setDate( checkDate.getDate() + 4 - ( checkDate.getDay() || 7 ) );

			time = checkDate.getTime();
			checkDate.setMonth( 0 ); // Compare with Jan 1
			checkDate.setDate( 1 );
			return Math.floor( Math.round( ( time - checkDate ) / 86400000 ) / 7 ) + 1;
		},

		/* Parse a string value into a date object.
	 * See formatDate below for the possible formats.
	 *
	 * @param  format string - the expected format of the date
	 * @param  value string - the date in the above format
	 * @param  settings Object - attributes include:
	 *					shortYearCutoff  number - the cutoff year for determining the century (optional)
	 *					dayNamesShort	string[7] - abbreviated names of the days from Sunday (optional)
	 *					dayNames		string[7] - names of the days from Sunday (optional)
	 *					monthNamesShort string[12] - abbreviated names of the months (optional)
	 *					monthNames		string[12] - names of the months (optional)
	 * @return  Date - the extracted date value or null if value is blank
	 */
		parseDate: function( format, value, settings ) {
			if ( format == null || value == null ) {
				throw "Invalid arguments";
			}

			value = ( typeof value === "object" ? value.toString() : value + "" );
			if ( value === "" ) {
				return null;
			}

			var iFormat, dim, extra,
				iValue = 0,
				shortYearCutoffTemp = ( settings ? settings.shortYearCutoff : null ) || this._defaults.shortYearCutoff,
				shortYearCutoff = ( typeof shortYearCutoffTemp !== "string" ? shortYearCutoffTemp :
					new Date().getFullYear() % 100 + parseInt( shortYearCutoffTemp, 10 ) ),
				dayNamesShort = ( settings ? settings.dayNamesShort : null ) || this._defaults.dayNamesShort,
				dayNames = ( settings ? settings.dayNames : null ) || this._defaults.dayNames,
				monthNamesShort = ( settings ? settings.monthNamesShort : null ) || this._defaults.monthNamesShort,
				monthNames = ( settings ? settings.monthNames : null ) || this._defaults.monthNames,
				year = -1,
				month = -1,
				day = -1,
				doy = -1,
				literal = false,
				date,

				// Check whether a format character is doubled
				lookAhead = function( match ) {
					var matches = ( iFormat + 1 < format.length && format.charAt( iFormat + 1 ) === match );
					if ( matches ) {
						iFormat++;
					}
					return matches;
				},

				// Extract a number from the string value
				getNumber = function( match ) {
					var isDoubled = lookAhead( match ),
						size = ( match === "@" ? 14 : ( match === "!" ? 20 :
							( match === "y" && isDoubled ? 4 : ( match === "o" ? 3 : 2 ) ) ) ),
						minSize = ( match === "y" ? size : 1 ),
						digits = new RegExp( "^\\d{" + minSize + "," + size + "}" ),
						num = value.substring( iValue ).match( digits );
					if ( !num ) {
						throw "Missing number at position " + iValue;
					}
					iValue += num[ 0 ].length;
					return parseInt( num[ 0 ], 10 );
				},

				// Extract a name from the string value and convert to an index
				getName = function( match, shortNames, longNames ) {
					var index = -1,
						names = $.map( lookAhead( match ) ? longNames : shortNames, function( v, k ) {
							return [ [ k, v ] ];
						} ).sort( function( a, b ) {
							return -( a[ 1 ].length - b[ 1 ].length );
						} );

					$.each( names, function( i, pair ) {
						var name = pair[ 1 ];
						if ( value.substr( iValue, name.length ).toLowerCase() === name.toLowerCase() ) {
							index = pair[ 0 ];
							iValue += name.length;
							return false;
						}
					} );
					if ( index !== -1 ) {
						return index + 1;
					} else {
						throw "Unknown name at position " + iValue;
					}
				},

				// Confirm that a literal character matches the string value
				checkLiteral = function() {
					if ( value.charAt( iValue ) !== format.charAt( iFormat ) ) {
						throw "Unexpected literal at position " + iValue;
					}
					iValue++;
				};

			for ( iFormat = 0; iFormat < format.length; iFormat++ ) {
				if ( literal ) {
					if ( format.charAt( iFormat ) === "'" && !lookAhead( "'" ) ) {
						literal = false;
					} else {
						checkLiteral();
					}
				} else {
					switch ( format.charAt( iFormat ) ) {
						case "d":
							day = getNumber( "d" );
							break;
						case "D":
							getName( "D", dayNamesShort, dayNames );
							break;
						case "o":
							doy = getNumber( "o" );
							break;
						case "m":
							month = getNumber( "m" );
							break;
						case "M":
							month = getName( "M", monthNamesShort, monthNames );
							break;
						case "y":
							year = getNumber( "y" );
							break;
						case "@":
							date = new Date( getNumber( "@" ) );
							year = date.getFullYear();
							month = date.getMonth() + 1;
							day = date.getDate();
							break;
						case "!":
							date = new Date( ( getNumber( "!" ) - this._ticksTo1970 ) / 10000 );
							year = date.getFullYear();
							month = date.getMonth() + 1;
							day = date.getDate();
							break;
						case "'":
							if ( lookAhead( "'" ) ) {
								checkLiteral();
							} else {
								literal = true;
							}
							break;
						default:
							checkLiteral();
					}
				}
			}

			if ( iValue < value.length ) {
				extra = value.substr( iValue );
				if ( !/^\s+/.test( extra ) ) {
					throw "Extra/unparsed characters found in date: " + extra;
				}
			}

			if ( year === -1 ) {
				year = new Date().getFullYear();
			} else if ( year < 100 ) {
				year += new Date().getFullYear() - new Date().getFullYear() % 100 +
					( year <= shortYearCutoff ? 0 : -100 );
			}

			if ( doy > -1 ) {
				month = 1;
				day = doy;
				do {
					dim = this._getDaysInMonth( year, month - 1 );
					if ( day <= dim ) {
						break;
					}
					month++;
					day -= dim;
				} while ( true );
			}

			date = this._daylightSavingAdjust( new Date( year, month - 1, day ) );
			if ( date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day ) {
				throw "Invalid date"; // E.g. 31/02/00
			}
			return date;
		},

		/* Standard date formats. */
		ATOM: "yy-mm-dd", // RFC 3339 (ISO 8601)
		COOKIE: "D, dd M yy",
		ISO_8601: "yy-mm-dd",
		RFC_822: "D, d M y",
		RFC_850: "DD, dd-M-y",
		RFC_1036: "D, d M y",
		RFC_1123: "D, d M yy",
		RFC_2822: "D, d M yy",
		RSS: "D, d M y", // RFC 822
		TICKS: "!",
		TIMESTAMP: "@",
		W3C: "yy-mm-dd", // ISO 8601

		_ticksTo1970: ( ( ( 1970 - 1 ) * 365 + Math.floor( 1970 / 4 ) - Math.floor( 1970 / 100 ) +
			Math.floor( 1970 / 400 ) ) * 24 * 60 * 60 * 10000000 ),

		/* Format a date object into a string value.
	 * The format can be combinations of the following:
	 * d  - day of month (no leading zero)
	 * dd - day of month (two digit)
	 * o  - day of year (no leading zeros)
	 * oo - day of year (three digit)
	 * D  - day name short
	 * DD - day name long
	 * m  - month of year (no leading zero)
	 * mm - month of year (two digit)
	 * M  - month name short
	 * MM - month name long
	 * y  - year (two digit)
	 * yy - year (four digit)
	 * @ - Unix timestamp (ms since 01/01/1970)
	 * ! - Windows ticks (100ns since 01/01/0001)
	 * "..." - literal text
	 * '' - single quote
	 *
	 * @param  format string - the desired format of the date
	 * @param  date Date - the date value to format
	 * @param  settings Object - attributes include:
	 *					dayNamesShort	string[7] - abbreviated names of the days from Sunday (optional)
	 *					dayNames		string[7] - names of the days from Sunday (optional)
	 *					monthNamesShort string[12] - abbreviated names of the months (optional)
	 *					monthNames		string[12] - names of the months (optional)
	 * @return  string - the date in the above format
	 */
		formatDate: function( format, date, settings ) {
			if ( !date ) {
				return "";
			}

			var iFormat,
				dayNamesShort = ( settings ? settings.dayNamesShort : null ) || this._defaults.dayNamesShort,
				dayNames = ( settings ? settings.dayNames : null ) || this._defaults.dayNames,
				monthNamesShort = ( settings ? settings.monthNamesShort : null ) || this._defaults.monthNamesShort,
				monthNames = ( settings ? settings.monthNames : null ) || this._defaults.monthNames,

				// Check whether a format character is doubled
				lookAhead = function( match ) {
					var matches = ( iFormat + 1 < format.length && format.charAt( iFormat + 1 ) === match );
					if ( matches ) {
						iFormat++;
					}
					return matches;
				},

				// Format a number, with leading zero if necessary
				formatNumber = function( match, value, len ) {
					var num = "" + value;
					if ( lookAhead( match ) ) {
						while ( num.length < len ) {
							num = "0" + num;
						}
					}
					return num;
				},

				// Format a name, short or long as requested
				formatName = function( match, value, shortNames, longNames ) {
					return ( lookAhead( match ) ? longNames[ value ] : shortNames[ value ] );
				},
				output = "",
				literal = false;

			if ( date ) {
				for ( iFormat = 0; iFormat < format.length; iFormat++ ) {
					if ( literal ) {
						if ( format.charAt( iFormat ) === "'" && !lookAhead( "'" ) ) {
							literal = false;
						} else {
							output += format.charAt( iFormat );
						}
					} else {
						switch ( format.charAt( iFormat ) ) {
							case "d":
								output += formatNumber( "d", date.getDate(), 2 );
								break;
							case "D":
								output += formatName( "D", date.getDay(), dayNamesShort, dayNames );
								break;
							case "o":
								output += formatNumber( "o",
									Math.round( ( new Date( date.getFullYear(), date.getMonth(), date.getDate() ).getTime() - new Date( date.getFullYear(), 0, 0 ).getTime() ) / 86400000 ), 3 );
								break;
							case "m":
								output += formatNumber( "m", date.getMonth() + 1, 2 );
								break;
							case "M":
								output += formatName( "M", date.getMonth(), monthNamesShort, monthNames );
								break;
							case "y":
								output += ( lookAhead( "y" ) ? date.getFullYear() :
									( date.getFullYear() % 100 < 10 ? "0" : "" ) + date.getFullYear() % 100 );
								break;
							case "@":
								output += date.getTime();
								break;
							case "!":
								output += date.getTime() * 10000 + this._ticksTo1970;
								break;
							case "'":
								if ( lookAhead( "'" ) ) {
									output += "'";
								} else {
									literal = true;
								}
								break;
							default:
								output += format.charAt( iFormat );
						}
					}
				}
			}
			return output;
		},

		/* Extract all possible characters from the date format. */
		_possibleChars: function( format ) {
			var iFormat,
				chars = "",
				literal = false,

				// Check whether a format character is doubled
				lookAhead = function( match ) {
					var matches = ( iFormat + 1 < format.length && format.charAt( iFormat + 1 ) === match );
					if ( matches ) {
						iFormat++;
					}
					return matches;
				};

			for ( iFormat = 0; iFormat < format.length; iFormat++ ) {
				if ( literal ) {
					if ( format.charAt( iFormat ) === "'" && !lookAhead( "'" ) ) {
						literal = false;
					} else {
						chars += format.charAt( iFormat );
					}
				} else {
					switch ( format.charAt( iFormat ) ) {
						case "d": case "m": case "y": case "@":
							chars += "0123456789";
							break;
						case "D": case "M":
							return null; // Accept anything
						case "'":
							if ( lookAhead( "'" ) ) {
								chars += "'";
							} else {
								literal = true;
							}
							break;
						default:
							chars += format.charAt( iFormat );
					}
				}
			}
			return chars;
		},

		/* Get a setting value, defaulting if necessary. */
		_get: function( inst, name ) {
			return inst.settings[ name ] !== undefined ?
				inst.settings[ name ] : this._defaults[ name ];
		},

		/* Parse existing date and initialise date picker. */
		_setDateFromField: function( inst, noDefault ) {
			if ( inst.input.val() === inst.lastVal ) {
				return;
			}

			var dateFormat = this._get( inst, "dateFormat" ),
				dates = inst.lastVal = inst.input ? inst.input.val() : null,
				defaultDate = this._getDefaultDate( inst ),
				date = defaultDate,
				settings = this._getFormatConfig( inst );

			try {
				date = this.parseDate( dateFormat, dates, settings ) || defaultDate;
			} catch ( event ) {
				dates = ( noDefault ? "" : dates );
			}
			inst.selectedDay = date.getDate();
			inst.drawMonth = inst.selectedMonth = date.getMonth();
			inst.drawYear = inst.selectedYear = date.getFullYear();
			inst.currentDay = ( dates ? date.getDate() : 0 );
			inst.currentMonth = ( dates ? date.getMonth() : 0 );
			inst.currentYear = ( dates ? date.getFullYear() : 0 );
			this._adjustInstDate( inst );
		},

		/* Retrieve the default date shown on opening. */
		_getDefaultDate: function( inst ) {
			return this._restrictMinMax( inst,
				this._determineDate( inst, this._get( inst, "defaultDate" ), new Date() ) );
		},

		/* A date may be specified as an exact value or a relative one. */
		_determineDate: function( inst, date, defaultDate ) {
			var offsetNumeric = function( offset ) {
					var date = new Date();
					date.setDate( date.getDate() + offset );
					return date;
				},
				offsetString = function( offset ) {
					try {
						return $.datepicker.parseDate( $.datepicker._get( inst, "dateFormat" ),
							offset, $.datepicker._getFormatConfig( inst ) );
					} catch ( e ) {

						// Ignore
					}

					var date = ( offset.toLowerCase().match( /^c/ ) ?
							$.datepicker._getDate( inst ) : null ) || new Date(),
						year = date.getFullYear(),
						month = date.getMonth(),
						day = date.getDate(),
						pattern = /([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,
						matches = pattern.exec( offset );

					while ( matches ) {
						switch ( matches[ 2 ] || "d" ) {
							case "d" : case "D" :
								day += parseInt( matches[ 1 ], 10 ); break;
							case "w" : case "W" :
								day += parseInt( matches[ 1 ], 10 ) * 7; break;
							case "m" : case "M" :
								month += parseInt( matches[ 1 ], 10 );
								day = Math.min( day, $.datepicker._getDaysInMonth( year, month ) );
								break;
							case "y": case "Y" :
								year += parseInt( matches[ 1 ], 10 );
								day = Math.min( day, $.datepicker._getDaysInMonth( year, month ) );
								break;
						}
						matches = pattern.exec( offset );
					}
					return new Date( year, month, day );
				},
				newDate = ( date == null || date === "" ? defaultDate : ( typeof date === "string" ? offsetString( date ) :
					( typeof date === "number" ? ( isNaN( date ) ? defaultDate : offsetNumeric( date ) ) : new Date( date.getTime() ) ) ) );

			newDate = ( newDate && newDate.toString() === "Invalid Date" ? defaultDate : newDate );
			if ( newDate ) {
				newDate.setHours( 0 );
				newDate.setMinutes( 0 );
				newDate.setSeconds( 0 );
				newDate.setMilliseconds( 0 );
			}
			return this._daylightSavingAdjust( newDate );
		},

		/* Handle switch to/from daylight saving.
	 * Hours may be non-zero on daylight saving cut-over:
	 * > 12 when midnight changeover, but then cannot generate
	 * midnight datetime, so jump to 1AM, otherwise reset.
	 * @param  date  (Date) the date to check
	 * @return  (Date) the corrected date
	 */
		_daylightSavingAdjust: function( date ) {
			if ( !date ) {
				return null;
			}
			date.setHours( date.getHours() > 12 ? date.getHours() + 2 : 0 );
			return date;
		},

		/* Set the date(s) directly. */
		_setDate: function( inst, date, noChange ) {
			var clear = !date,
				origMonth = inst.selectedMonth,
				origYear = inst.selectedYear,
				newDate = this._restrictMinMax( inst, this._determineDate( inst, date, new Date() ) );

			inst.selectedDay = inst.currentDay = newDate.getDate();
			inst.drawMonth = inst.selectedMonth = inst.currentMonth = newDate.getMonth();
			inst.drawYear = inst.selectedYear = inst.currentYear = newDate.getFullYear();
			if ( ( origMonth !== inst.selectedMonth || origYear !== inst.selectedYear ) && !noChange ) {
				this._notifyChange( inst );
			}
			this._adjustInstDate( inst );
			if ( inst.input ) {
				inst.input.val( clear ? "" : this._formatDate( inst ) );
			}
		},

		/* Retrieve the date(s) directly. */
		_getDate: function( inst ) {
			var startDate = ( !inst.currentYear || ( inst.input && inst.input.val() === "" ) ? null :
				this._daylightSavingAdjust( new Date(
					inst.currentYear, inst.currentMonth, inst.currentDay ) ) );
			return startDate;
		},

		/* Attach the onxxx handlers.  These are declared statically so
	 * they work with static code transformers like Caja.
	 */
		_attachHandlers: function( inst ) {
			var stepMonths = this._get( inst, "stepMonths" ),
				id = "#" + inst.id.replace( /\\\\/g, "\\" );
			inst.dpDiv.find( "[data-handler]" ).map( function() {
				var handler = {
					prev: function() {
						$.datepicker._adjustDate( id, -stepMonths, "M" );
					},
					next: function() {
						$.datepicker._adjustDate( id, +stepMonths, "M" );
					},
					hide: function() {
						$.datepicker._hideDatepicker();
					},
					today: function() {
						$.datepicker._gotoToday( id );
					},
					selectDay: function() {
						$.datepicker._selectDay( id, +this.getAttribute( "data-month" ), +this.getAttribute( "data-year" ), this );
						return false;
					},
					selectMonth: function() {
						$.datepicker._selectMonthYear( id, this, "M" );
						return false;
					},
					selectYear: function() {
						$.datepicker._selectMonthYear( id, this, "Y" );
						return false;
					}
				};
				$( this ).on( this.getAttribute( "data-event" ), handler[ this.getAttribute( "data-handler" ) ] );
			} );
		},

		/* Generate the HTML for the current state of the date picker. */
		_generateHTML: function( inst ) {
			var maxDraw, prevText, prev, nextText, next, currentText, gotoDate,
				controls, buttonPanel, firstDay, showWeek, dayNames, dayNamesMin,
				monthNames, monthNamesShort, beforeShowDay, showOtherMonths,
				selectOtherMonths, defaultDate, html, dow, row, group, col, selectedDate,
				cornerClass, calender, thead, day, daysInMonth, leadDays, curRows, numRows,
				printDate, dRow, tbody, daySettings, otherMonth, unselectable,
				tempDate = new Date(),
				today = this._daylightSavingAdjust(
					new Date( tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate() ) ), // clear time
				isRTL = this._get( inst, "isRTL" ),
				showButtonPanel = this._get( inst, "showButtonPanel" ),
				hideIfNoPrevNext = this._get( inst, "hideIfNoPrevNext" ),
				navigationAsDateFormat = this._get( inst, "navigationAsDateFormat" ),
				numMonths = this._getNumberOfMonths( inst ),
				showCurrentAtPos = this._get( inst, "showCurrentAtPos" ),
				stepMonths = this._get( inst, "stepMonths" ),
				isMultiMonth = ( numMonths[ 0 ] !== 1 || numMonths[ 1 ] !== 1 ),
				currentDate = this._daylightSavingAdjust( ( !inst.currentDay ? new Date( 9999, 9, 9 ) :
					new Date( inst.currentYear, inst.currentMonth, inst.currentDay ) ) ),
				minDate = this._getMinMaxDate( inst, "min" ),
				maxDate = this._getMinMaxDate( inst, "max" ),
				drawMonth = inst.drawMonth - showCurrentAtPos,
				drawYear = inst.drawYear;

			if ( drawMonth < 0 ) {
				drawMonth += 12;
				drawYear--;
			}
			if ( maxDate ) {
				maxDraw = this._daylightSavingAdjust( new Date( maxDate.getFullYear(),
					maxDate.getMonth() - ( numMonths[ 0 ] * numMonths[ 1 ] ) + 1, maxDate.getDate() ) );
				maxDraw = ( minDate && maxDraw < minDate ? minDate : maxDraw );
				while ( this._daylightSavingAdjust( new Date( drawYear, drawMonth, 1 ) ) > maxDraw ) {
					drawMonth--;
					if ( drawMonth < 0 ) {
						drawMonth = 11;
						drawYear--;
					}
				}
			}
			inst.drawMonth = drawMonth;
			inst.drawYear = drawYear;

			prevText = this._get( inst, "prevText" );
			prevText = ( !navigationAsDateFormat ? prevText : this.formatDate( prevText,
				this._daylightSavingAdjust( new Date( drawYear, drawMonth - stepMonths, 1 ) ),
				this._getFormatConfig( inst ) ) );

			if ( this._canAdjustMonth( inst, -1, drawYear, drawMonth ) ) {
				prev = $( "<a>" )
				.attr( {
					"class": "ui-datepicker-prev ui-corner-all",
					"data-handler": "prev",
					"data-event": "click",
					title: prevText
				} )
				.append(
					$( "<span>" )
					.addClass( "ui-icon ui-icon-circle-triangle-" +
						( isRTL ? "e" : "w" ) )
					.text( prevText )
				)[ 0 ].outerHTML;
			} else if ( hideIfNoPrevNext ) {
				prev = "";
			} else {
				prev = $( "<a>" )
				.attr( {
					"class": "ui-datepicker-prev ui-corner-all ui-state-disabled",
					title: prevText
				} )
				.append(
					$( "<span>" )
					.addClass( "ui-icon ui-icon-circle-triangle-" +
						( isRTL ? "e" : "w" ) )
					.text( prevText )
				)[ 0 ].outerHTML;
			}

			nextText = this._get( inst, "nextText" );
			nextText = ( !navigationAsDateFormat ? nextText : this.formatDate( nextText,
				this._daylightSavingAdjust( new Date( drawYear, drawMonth + stepMonths, 1 ) ),
				this._getFormatConfig( inst ) ) );

			if ( this._canAdjustMonth( inst, +1, drawYear, drawMonth ) ) {
				next = $( "<a>" )
				.attr( {
					"class": "ui-datepicker-next ui-corner-all",
					"data-handler": "next",
					"data-event": "click",
					title: nextText
				} )
				.append(
					$( "<span>" )
					.addClass( "ui-icon ui-icon-circle-triangle-" +
						( isRTL ? "w" : "e" ) )
					.text( nextText )
				)[ 0 ].outerHTML;
			} else if ( hideIfNoPrevNext ) {
				next = "";
			} else {
				next = $( "<a>" )
				.attr( {
					"class": "ui-datepicker-next ui-corner-all ui-state-disabled",
					title: nextText
				} )
				.append(
					$( "<span>" )
					.attr( "class", "ui-icon ui-icon-circle-triangle-" +
						( isRTL ? "w" : "e" ) )
					.text( nextText )
				)[ 0 ].outerHTML;
			}

			currentText = this._get( inst, "currentText" );
			gotoDate = ( this._get( inst, "gotoCurrent" ) && inst.currentDay ? currentDate : today );
			currentText = ( !navigationAsDateFormat ? currentText :
				this.formatDate( currentText, gotoDate, this._getFormatConfig( inst ) ) );

			controls = "";
			if ( !inst.inline ) {
				controls = $( "<button>" )
				.attr( {
					type: "button",
					"class": "ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all",
					"data-handler": "hide",
					"data-event": "click"
				} )
				.text( this._get( inst, "closeText" ) )[ 0 ].outerHTML;
			}

			buttonPanel = "";
			if ( showButtonPanel ) {
				buttonPanel = $( "<div class='ui-datepicker-buttonpane ui-widget-content'>" )
				.append( isRTL ? controls : "" )
				.append( this._isInRange( inst, gotoDate ) ?
					$( "<button>" )
					.attr( {
						type: "button",
						"class": "ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all",
						"data-handler": "today",
						"data-event": "click"
					} )
					.text( currentText ) :
					"" )
				.append( isRTL ? "" : controls )[ 0 ].outerHTML;
			}

			firstDay = parseInt( this._get( inst, "firstDay" ), 10 );
			firstDay = ( isNaN( firstDay ) ? 0 : firstDay );

			showWeek = this._get( inst, "showWeek" );
			dayNames = this._get( inst, "dayNames" );
			dayNamesMin = this._get( inst, "dayNamesMin" );
			monthNames = this._get( inst, "monthNames" );
			monthNamesShort = this._get( inst, "monthNamesShort" );
			beforeShowDay = this._get( inst, "beforeShowDay" );
			showOtherMonths = this._get( inst, "showOtherMonths" );
			selectOtherMonths = this._get( inst, "selectOtherMonths" );
			defaultDate = this._getDefaultDate( inst );
			html = "";

			for ( row = 0; row < numMonths[ 0 ]; row++ ) {
				group = "";
				this.maxRows = 4;
				for ( col = 0; col < numMonths[ 1 ]; col++ ) {
					selectedDate = this._daylightSavingAdjust( new Date( drawYear, drawMonth, inst.selectedDay ) );
					cornerClass = " ui-corner-all";
					calender = "";
					if ( isMultiMonth ) {
						calender += "<div class='ui-datepicker-group";
						if ( numMonths[ 1 ] > 1 ) {
							switch ( col ) {
								case 0: calender += " ui-datepicker-group-first";
									cornerClass = " ui-corner-" + ( isRTL ? "right" : "left" ); break;
								case numMonths[ 1 ] - 1: calender += " ui-datepicker-group-last";
									cornerClass = " ui-corner-" + ( isRTL ? "left" : "right" ); break;
								default: calender += " ui-datepicker-group-middle"; cornerClass = ""; break;
							}
						}
						calender += "'>";
					}
					calender += "<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix" + cornerClass + "'>" +
						( /all|left/.test( cornerClass ) && row === 0 ? ( isRTL ? next : prev ) : "" ) +
						( /all|right/.test( cornerClass ) && row === 0 ? ( isRTL ? prev : next ) : "" ) +
						this._generateMonthYearHeader( inst, drawMonth, drawYear, minDate, maxDate,
							row > 0 || col > 0, monthNames, monthNamesShort ) + // draw month headers
						"</div><table class='ui-datepicker-calendar'><thead>" +
						"<tr>";
					thead = ( showWeek ? "<th class='ui-datepicker-week-col'>" + this._get( inst, "weekHeader" ) + "</th>" : "" );
					for ( dow = 0; dow < 7; dow++ ) { // days of the week
						day = ( dow + firstDay ) % 7;
						thead += "<th scope='col'" + ( ( dow + firstDay + 6 ) % 7 >= 5 ? " class='ui-datepicker-week-end'" : "" ) + ">" +
							"<span title='" + dayNames[ day ] + "'>" + dayNamesMin[ day ] + "</span></th>";
					}
					calender += thead + "</tr></thead><tbody>";
					daysInMonth = this._getDaysInMonth( drawYear, drawMonth );
					if ( drawYear === inst.selectedYear && drawMonth === inst.selectedMonth ) {
						inst.selectedDay = Math.min( inst.selectedDay, daysInMonth );
					}
					leadDays = ( this._getFirstDayOfMonth( drawYear, drawMonth ) - firstDay + 7 ) % 7;
					curRows = Math.ceil( ( leadDays + daysInMonth ) / 7 ); // calculate the number of rows to generate
					numRows = ( isMultiMonth ? this.maxRows > curRows ? this.maxRows : curRows : curRows ); //If multiple months, use the higher number of rows (see #7043)
					this.maxRows = numRows;
					printDate = this._daylightSavingAdjust( new Date( drawYear, drawMonth, 1 - leadDays ) );
					for ( dRow = 0; dRow < numRows; dRow++ ) { // create date picker rows
						calender += "<tr>";
						tbody = ( !showWeek ? "" : "<td class='ui-datepicker-week-col'>" +
							this._get( inst, "calculateWeek" )( printDate ) + "</td>" );
						for ( dow = 0; dow < 7; dow++ ) { // create date picker days
							daySettings = ( beforeShowDay ?
								beforeShowDay.apply( ( inst.input ? inst.input[ 0 ] : null ), [ printDate ] ) : [ true, "" ] );
							otherMonth = ( printDate.getMonth() !== drawMonth );
							unselectable = ( otherMonth && !selectOtherMonths ) || !daySettings[ 0 ] ||
								( minDate && printDate < minDate ) || ( maxDate && printDate > maxDate );
							tbody += "<td class='" +
								( ( dow + firstDay + 6 ) % 7 >= 5 ? " ui-datepicker-week-end" : "" ) + // highlight weekends
								( otherMonth ? " ui-datepicker-other-month" : "" ) + // highlight days from other months
								( ( printDate.getTime() === selectedDate.getTime() && drawMonth === inst.selectedMonth && inst._keyEvent ) || // user pressed key
								( defaultDate.getTime() === printDate.getTime() && defaultDate.getTime() === selectedDate.getTime() ) ?

									// or defaultDate is current printedDate and defaultDate is selectedDate
									" " + this._dayOverClass : "" ) + // highlight selected day
								( unselectable ? " " + this._unselectableClass + " ui-state-disabled" : "" ) +  // highlight unselectable days
								( otherMonth && !showOtherMonths ? "" : " " + daySettings[ 1 ] + // highlight custom dates
									( printDate.getTime() === currentDate.getTime() ? " " + this._currentClass : "" ) + // highlight selected day
									( printDate.getTime() === today.getTime() ? " ui-datepicker-today" : "" ) ) + "'" + // highlight today (if different)
								( ( !otherMonth || showOtherMonths ) && daySettings[ 2 ] ? " title='" + daySettings[ 2 ].replace( /'/g, "&#39;" ) + "'" : "" ) + // cell title
								( unselectable ? "" : " data-handler='selectDay' data-event='click' data-month='" + printDate.getMonth() + "' data-year='" + printDate.getFullYear() + "'" ) + ">" + // actions
								( otherMonth && !showOtherMonths ? "&#xa0;" : // display for other months
									( unselectable ? "<span class='ui-state-default'>" + printDate.getDate() + "</span>" : "<a class='ui-state-default" +
										( printDate.getTime() === today.getTime() ? " ui-state-highlight" : "" ) +
										( printDate.getTime() === currentDate.getTime() ? " ui-state-active" : "" ) + // highlight selected day
										( otherMonth ? " ui-priority-secondary" : "" ) + // distinguish dates from other months
										"' href='#' aria-current='" + ( printDate.getTime() === currentDate.getTime() ? "true" : "false" ) + // mark date as selected for screen reader
										"' data-date='" + printDate.getDate() + // store date as data
										"'>" + printDate.getDate() + "</a>" ) ) + "</td>"; // display selectable date
							printDate.setDate( printDate.getDate() + 1 );
							printDate = this._daylightSavingAdjust( printDate );
						}
						calender += tbody + "</tr>";
					}
					drawMonth++;
					if ( drawMonth > 11 ) {
						drawMonth = 0;
						drawYear++;
					}
					calender += "</tbody></table>" + ( isMultiMonth ? "</div>" +
						( ( numMonths[ 0 ] > 0 && col === numMonths[ 1 ] - 1 ) ? "<div class='ui-datepicker-row-break'></div>" : "" ) : "" );
					group += calender;
				}
				html += group;
			}
			html += buttonPanel;
			inst._keyEvent = false;
			return html;
		},

		/* Generate the month and year header. */
		_generateMonthYearHeader: function( inst, drawMonth, drawYear, minDate, maxDate,
																				secondary, monthNames, monthNamesShort ) {

			var inMinYear, inMaxYear, month, years, thisYear, determineYear, year, endYear,
				changeMonth = this._get( inst, "changeMonth" ),
				changeYear = this._get( inst, "changeYear" ),
				showMonthAfterYear = this._get( inst, "showMonthAfterYear" ),
				selectMonthLabel = this._get( inst, "selectMonthLabel" ),
				selectYearLabel = this._get( inst, "selectYearLabel" ),
				html = "<div class='ui-datepicker-title'>",
				monthHtml = "";

			// Month selection
			if ( secondary || !changeMonth ) {
				monthHtml += "<span class='ui-datepicker-month'>" + monthNames[ drawMonth ] + "</span>";
			} else {
				inMinYear = ( minDate && minDate.getFullYear() === drawYear );
				inMaxYear = ( maxDate && maxDate.getFullYear() === drawYear );
				monthHtml += "<select class='ui-datepicker-month' aria-label='" + selectMonthLabel + "' data-handler='selectMonth' data-event='change'>";
				for ( month = 0; month < 12; month++ ) {
					if ( ( !inMinYear || month >= minDate.getMonth() ) && ( !inMaxYear || month <= maxDate.getMonth() ) ) {
						monthHtml += "<option value='" + month + "'" +
							( month === drawMonth ? " selected='selected'" : "" ) +
							">" + monthNamesShort[ month ] + "</option>";
					}
				}
				monthHtml += "</select>";
			}

			if ( !showMonthAfterYear ) {
				html += monthHtml + ( secondary || !( changeMonth && changeYear ) ? "&#xa0;" : "" );
			}

			// Year selection
			if ( !inst.yearshtml ) {
				inst.yearshtml = "";
				if ( secondary || !changeYear ) {
					html += "<span class='ui-datepicker-year'>" + drawYear + "</span>";
				} else {

					// determine range of years to display
					years = this._get( inst, "yearRange" ).split( ":" );
					thisYear = new Date().getFullYear();
					determineYear = function( value ) {
						var year = ( value.match( /c[+\-].*/ ) ? drawYear + parseInt( value.substring( 1 ), 10 ) :
							( value.match( /[+\-].*/ ) ? thisYear + parseInt( value, 10 ) :
								parseInt( value, 10 ) ) );
						return ( isNaN( year ) ? thisYear : year );
					};
					year = determineYear( years[ 0 ] );
					endYear = Math.max( year, determineYear( years[ 1 ] || "" ) );
					year = ( minDate ? Math.max( year, minDate.getFullYear() ) : year );
					endYear = ( maxDate ? Math.min( endYear, maxDate.getFullYear() ) : endYear );
					inst.yearshtml += "<select class='ui-datepicker-year' aria-label='" + selectYearLabel + "' data-handler='selectYear' data-event='change'>";
					for ( ; year <= endYear; year++ ) {
						inst.yearshtml += "<option value='" + year + "'" +
							( year === drawYear ? " selected='selected'" : "" ) +
							">" + year + "</option>";
					}
					inst.yearshtml += "</select>";

					html += inst.yearshtml;
					inst.yearshtml = null;
				}
			}

			html += this._get( inst, "yearSuffix" );
			if ( showMonthAfterYear ) {
				html += ( secondary || !( changeMonth && changeYear ) ? "&#xa0;" : "" ) + monthHtml;
			}
			html += "</div>"; // Close datepicker_header
			return html;
		},

		/* Adjust one of the date sub-fields. */
		_adjustInstDate: function( inst, offset, period ) {
			var year = inst.selectedYear + ( period === "Y" ? offset : 0 ),
				month = inst.selectedMonth + ( period === "M" ? offset : 0 ),
				day = Math.min( inst.selectedDay, this._getDaysInMonth( year, month ) ) + ( period === "D" ? offset : 0 ),
				date = this._restrictMinMax( inst, this._daylightSavingAdjust( new Date( year, month, day ) ) );

			inst.selectedDay = date.getDate();
			inst.drawMonth = inst.selectedMonth = date.getMonth();
			inst.drawYear = inst.selectedYear = date.getFullYear();
			if ( period === "M" || period === "Y" ) {
				this._notifyChange( inst );
			}
		},

		/* Ensure a date is within any min/max bounds. */
		_restrictMinMax: function( inst, date ) {
			var minDate = this._getMinMaxDate( inst, "min" ),
				maxDate = this._getMinMaxDate( inst, "max" ),
				newDate = ( minDate && date < minDate ? minDate : date );
			return ( maxDate && newDate > maxDate ? maxDate : newDate );
		},

		/* Notify change of month/year. */
		_notifyChange: function( inst ) {
			var onChange = this._get( inst, "onChangeMonthYear" );
			if ( onChange ) {
				onChange.apply( ( inst.input ? inst.input[ 0 ] : null ),
					[ inst.selectedYear, inst.selectedMonth + 1, inst ] );
			}
		},

		/* Determine the number of months to show. */
		_getNumberOfMonths: function( inst ) {
			var numMonths = this._get( inst, "numberOfMonths" );
			return ( numMonths == null ? [ 1, 1 ] : ( typeof numMonths === "number" ? [ 1, numMonths ] : numMonths ) );
		},

		/* Determine the current maximum date - ensure no time components are set. */
		_getMinMaxDate: function( inst, minMax ) {
			return this._determineDate( inst, this._get( inst, minMax + "Date" ), null );
		},

		/* Find the number of days in a given month. */
		_getDaysInMonth: function( year, month ) {
			return 32 - this._daylightSavingAdjust( new Date( year, month, 32 ) ).getDate();
		},

		/* Find the day of the week of the first of a month. */
		_getFirstDayOfMonth: function( year, month ) {
			return new Date( year, month, 1 ).getDay();
		},

		/* Determines if we should allow a "next/prev" month display change. */
		_canAdjustMonth: function( inst, offset, curYear, curMonth ) {
			var numMonths = this._getNumberOfMonths( inst ),
				date = this._daylightSavingAdjust( new Date( curYear,
					curMonth + ( offset < 0 ? offset : numMonths[ 0 ] * numMonths[ 1 ] ), 1 ) );

			if ( offset < 0 ) {
				date.setDate( this._getDaysInMonth( date.getFullYear(), date.getMonth() ) );
			}
			return this._isInRange( inst, date );
		},

		/* Is the given date in the accepted range? */
		_isInRange: function( inst, date ) {
			var yearSplit, currentYear,
				minDate = this._getMinMaxDate( inst, "min" ),
				maxDate = this._getMinMaxDate( inst, "max" ),
				minYear = null,
				maxYear = null,
				years = this._get( inst, "yearRange" );
			if ( years ) {
				yearSplit = years.split( ":" );
				currentYear = new Date().getFullYear();
				minYear = parseInt( yearSplit[ 0 ], 10 );
				maxYear = parseInt( yearSplit[ 1 ], 10 );
				if ( yearSplit[ 0 ].match( /[+\-].*/ ) ) {
					minYear += currentYear;
				}
				if ( yearSplit[ 1 ].match( /[+\-].*/ ) ) {
					maxYear += currentYear;
				}
			}

			return ( ( !minDate || date.getTime() >= minDate.getTime() ) &&
				( !maxDate || date.getTime() <= maxDate.getTime() ) &&
				( !minYear || date.getFullYear() >= minYear ) &&
				( !maxYear || date.getFullYear() <= maxYear ) );
		},

		/* Provide the configuration settings for formatting/parsing. */
		_getFormatConfig: function( inst ) {
			var shortYearCutoff = this._get( inst, "shortYearCutoff" );
			shortYearCutoff = ( typeof shortYearCutoff !== "string" ? shortYearCutoff :
				new Date().getFullYear() % 100 + parseInt( shortYearCutoff, 10 ) );
			return { shortYearCutoff: shortYearCutoff,
				dayNamesShort: this._get( inst, "dayNamesShort" ), dayNames: this._get( inst, "dayNames" ),
				monthNamesShort: this._get( inst, "monthNamesShort" ), monthNames: this._get( inst, "monthNames" ) };
		},

		/* Format the given date for display. */
		_formatDate: function( inst, day, month, year ) {
			if ( !day ) {
				inst.currentDay = inst.selectedDay;
				inst.currentMonth = inst.selectedMonth;
				inst.currentYear = inst.selectedYear;
			}
			var date = ( day ? ( typeof day === "object" ? day :
					this._daylightSavingAdjust( new Date( year, month, day ) ) ) :
				this._daylightSavingAdjust( new Date( inst.currentYear, inst.currentMonth, inst.currentDay ) ) );
			return this.formatDate( this._get( inst, "dateFormat" ), date, this._getFormatConfig( inst ) );
		}
	} );

	/*
 * Bind hover events for datepicker elements.
 * Done via delegate so the binding only occurs once in the lifetime of the parent div.
 * Global datepicker_instActive, set by _updateDatepicker allows the handlers to find their way back to the active picker.
 */
	function datepicker_bindHover( dpDiv ) {
		var selector = "button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";
		return dpDiv.on( "mouseout", selector, function() {
			$( this ).removeClass( "ui-state-hover" );
			if ( this.className.indexOf( "ui-datepicker-prev" ) !== -1 ) {
				$( this ).removeClass( "ui-datepicker-prev-hover" );
			}
			if ( this.className.indexOf( "ui-datepicker-next" ) !== -1 ) {
				$( this ).removeClass( "ui-datepicker-next-hover" );
			}
		} )
		.on( "mouseover", selector, datepicker_handleMouseover );
	}

	function datepicker_handleMouseover() {
		if ( !$.datepicker._isDisabledDatepicker( datepicker_instActive.inline ? datepicker_instActive.dpDiv.parent()[ 0 ] : datepicker_instActive.input[ 0 ] ) ) {
			$( this ).parents( ".ui-datepicker-calendar" ).find( "a" ).removeClass( "ui-state-hover" );
			$( this ).addClass( "ui-state-hover" );
			if ( this.className.indexOf( "ui-datepicker-prev" ) !== -1 ) {
				$( this ).addClass( "ui-datepicker-prev-hover" );
			}
			if ( this.className.indexOf( "ui-datepicker-next" ) !== -1 ) {
				$( this ).addClass( "ui-datepicker-next-hover" );
			}
		}
	}

	/* jQuery extend now ignores nulls! */
	function datepicker_extendRemove( target, props ) {
		$.extend( target, props );
		for ( var name in props ) {
			if ( props[ name ] == null ) {
				target[ name ] = props[ name ];
			}
		}
		return target;
	}

	/* Invoke the datepicker functionality.
   @param  options  string - a command, optionally followed by additional parameters or
					Object - settings for attaching new datepicker functionality
   @return  jQuery object */
	$.fn.datepicker = function( options ) {

		/* Verify an empty collection wasn't passed - Fixes #6976 */
		if ( !this.length ) {
			return this;
		}

		/* Initialise the date picker. */
		if ( !$.datepicker.initialized ) {
			$( document ).on( "mousedown", $.datepicker._checkExternalClick );
			$.datepicker.initialized = true;
		}

		/* Append datepicker main container to body if not exist. */
		if ( $( "#" + $.datepicker._mainDivId ).length === 0 ) {
			$( "body" ).append( $.datepicker.dpDiv );
		}

		var otherArgs = Array.prototype.slice.call( arguments, 1 );
		if ( typeof options === "string" && ( options === "isDisabled" || options === "getDate" || options === "widget" ) ) {
			return $.datepicker[ "_" + options + "Datepicker" ].
			apply( $.datepicker, [ this[ 0 ] ].concat( otherArgs ) );
		}
		if ( options === "option" && arguments.length === 2 && typeof arguments[ 1 ] === "string" ) {
			return $.datepicker[ "_" + options + "Datepicker" ].
			apply( $.datepicker, [ this[ 0 ] ].concat( otherArgs ) );
		}
		return this.each( function() {
			if ( typeof options === "string" ) {
				$.datepicker[ "_" + options + "Datepicker" ]
				.apply( $.datepicker, [ this ].concat( otherArgs ) );
			} else {
				$.datepicker._attachDatepicker( this, options );
			}
		} );
	};

	$.datepicker = new Datepicker(); // singleton instance
	$.datepicker.initialized = false;
	$.datepicker.uuid = new Date().getTime();
	$.datepicker.version = "1.13.0";

	var widgetsDatepicker = $.datepicker;



// This file is deprecated
	var ie = $.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );

	/*!
 * jQuery UI Mouse 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Mouse
//>>group: Widgets
//>>description: Abstracts mouse-based interactions to assist in creating certain widgets.
//>>docs: http://api.jqueryui.com/mouse/


	var mouseHandled = false;
	$( document ).on( "mouseup", function() {
		mouseHandled = false;
	} );

	var widgetsMouse = $.widget( "ui.mouse", {
		version: "1.13.0",
		options: {
			cancel: "input, textarea, button, select, option",
			distance: 1,
			delay: 0
		},
		_mouseInit: function() {
			var that = this;

			this.element
			.on( "mousedown." + this.widgetName, function( event ) {
				return that._mouseDown( event );
			} )
			.on( "click." + this.widgetName, function( event ) {
				if ( true === $.data( event.target, that.widgetName + ".preventClickEvent" ) ) {
					$.removeData( event.target, that.widgetName + ".preventClickEvent" );
					event.stopImmediatePropagation();
					return false;
				}
			} );

			this.started = false;
		},

		// TODO: make sure destroying one instance of mouse doesn't mess with
		// other instances of mouse
		_mouseDestroy: function() {
			this.element.off( "." + this.widgetName );
			if ( this._mouseMoveDelegate ) {
				this.document
				.off( "mousemove." + this.widgetName, this._mouseMoveDelegate )
				.off( "mouseup." + this.widgetName, this._mouseUpDelegate );
			}
		},

		_mouseDown: function( event ) {

			// don't let more than one widget handle mouseStart
			if ( mouseHandled ) {
				return;
			}

			this._mouseMoved = false;

			// We may have missed mouseup (out of window)
			if ( this._mouseStarted ) {
				this._mouseUp( event );
			}

			this._mouseDownEvent = event;

			var that = this,
				btnIsLeft = ( event.which === 1 ),

				// event.target.nodeName works around a bug in IE 8 with
				// disabled inputs (#7620)
				elIsCancel = ( typeof this.options.cancel === "string" && event.target.nodeName ?
					$( event.target ).closest( this.options.cancel ).length : false );
			if ( !btnIsLeft || elIsCancel || !this._mouseCapture( event ) ) {
				return true;
			}

			this.mouseDelayMet = !this.options.delay;
			if ( !this.mouseDelayMet ) {
				this._mouseDelayTimer = setTimeout( function() {
					that.mouseDelayMet = true;
				}, this.options.delay );
			}

			if ( this._mouseDistanceMet( event ) && this._mouseDelayMet( event ) ) {
				this._mouseStarted = ( this._mouseStart( event ) !== false );
				if ( !this._mouseStarted ) {
					event.preventDefault();
					return true;
				}
			}

			// Click event may never have fired (Gecko & Opera)
			if ( true === $.data( event.target, this.widgetName + ".preventClickEvent" ) ) {
				$.removeData( event.target, this.widgetName + ".preventClickEvent" );
			}

			// These delegates are required to keep context
			this._mouseMoveDelegate = function( event ) {
				return that._mouseMove( event );
			};
			this._mouseUpDelegate = function( event ) {
				return that._mouseUp( event );
			};

			this.document
			.on( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.on( "mouseup." + this.widgetName, this._mouseUpDelegate );

			if (this.widgetName === 'slider') {
				// Prevent tragging of slider handle(anchor) in Firefox
				event.preventDefault();
			}

			mouseHandled = true;
			return true;
		},

		_mouseMove: function( event ) {

			// Only check for mouseups outside the document if you've moved inside the document
			// at least once. This prevents the firing of mouseup in the case of IE<9, which will
			// fire a mousemove event if content is placed under the cursor. See #7778
			// Support: IE <9
			if ( this._mouseMoved ) {

				// IE mouseup check - mouseup happened when mouse was out of window
				if ( $.ui.ie && ( !document.documentMode || document.documentMode < 9 ) &&
					!event.button ) {
					return this._mouseUp( event );

					// Iframe mouseup check - mouseup occurred in another document
				} else if ( !event.which ) {

					// Support: Safari <=8 - 9
					// Safari sets which to 0 if you press any of the following keys
					// during a drag (#14461)
					if ( event.originalEvent.altKey || event.originalEvent.ctrlKey ||
						event.originalEvent.metaKey || event.originalEvent.shiftKey ) {
						this.ignoreMissingWhich = true;
					} else if ( !this.ignoreMissingWhich ) {
						return this._mouseUp( event );
					}
				}
			}

			if ( event.which || event.button ) {
				this._mouseMoved = true;
			}

			if ( this._mouseStarted ) {
				this._mouseDrag( event );
				return event.preventDefault();
			}

			if ( this._mouseDistanceMet( event ) && this._mouseDelayMet( event ) ) {
				this._mouseStarted =
					( this._mouseStart( this._mouseDownEvent, event ) !== false );
				if ( this._mouseStarted ) {
					this._mouseDrag( event );
				} else {
					this._mouseUp( event );
				}
			}

			return !this._mouseStarted;
		},

		_mouseUp: function( event ) {
			this.document
			.off( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.off( "mouseup." + this.widgetName, this._mouseUpDelegate );

			if ( this._mouseStarted ) {
				this._mouseStarted = false;

				if ( event.target === this._mouseDownEvent.target ) {
					$.data( event.target, this.widgetName + ".preventClickEvent", true );
				}

				this._mouseStop( event );
			}

			if ( this._mouseDelayTimer ) {
				clearTimeout( this._mouseDelayTimer );
				delete this._mouseDelayTimer;
			}

			this.ignoreMissingWhich = false;
			mouseHandled = false;
			event.preventDefault();
		},

		_mouseDistanceMet: function( event ) {
			return ( Math.max(
					Math.abs( this._mouseDownEvent.pageX - event.pageX ),
					Math.abs( this._mouseDownEvent.pageY - event.pageY )
				) >= this.options.distance
			);
		},

		_mouseDelayMet: function( /* event */ ) {
			return this.mouseDelayMet;
		},

		// These are placeholder methods, to be overriden by extending plugin
		_mouseStart: function( /* event */ ) {},
		_mouseDrag: function( /* event */ ) {},
		_mouseStop: function( /* event */ ) {},
		_mouseCapture: function( /* event */ ) {
			return true;
		}
	} );



// $.ui.plugin is deprecated. Use $.widget() extensions instead.
	var plugin = $.ui.plugin = {
		add: function( module, option, set ) {
			var i,
				proto = $.ui[ module ].prototype;
			for ( i in set ) {
				proto.plugins[ i ] = proto.plugins[ i ] || [];
				proto.plugins[ i ].push( [ option, set[ i ] ] );
			}
		},
		call: function( instance, name, args, allowDisconnected ) {
			var i,
				set = instance.plugins[ name ];

			if ( !set ) {
				return;
			}

			if ( !allowDisconnected && ( !instance.element[ 0 ].parentNode ||
				instance.element[ 0 ].parentNode.nodeType === 11 ) ) {
				return;
			}

			for ( i = 0; i < set.length; i++ ) {
				if ( instance.options[ set[ i ][ 0 ] ] ) {
					set[ i ][ 1 ].apply( instance.element, args );
				}
			}
		}
	};



	var safeBlur = $.ui.safeBlur = function( element ) {

		// Support: IE9 - 10 only
		// If the <body> is blurred, IE will switch windows, see #9420
		if ( element && element.nodeName.toLowerCase() !== "body" ) {
			$( element ).trigger( "blur" );
		}
	};


	/*!
 * jQuery UI Draggable 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Draggable
//>>group: Interactions
//>>description: Enables dragging functionality for any element.
//>>docs: http://api.jqueryui.com/draggable/
//>>demos: http://jqueryui.com/draggable/
//>>css.structure: ../../themes/base/draggable.css


	$.widget( "ui.draggable", $.ui.mouse, {
		version: "1.13.0",
		widgetEventPrefix: "drag",
		options: {
			addClasses: true,
			appendTo: "parent",
			axis: false,
			connectToSortable: false,
			containment: false,
			cursor: "auto",
			cursorAt: false,
			grid: false,
			handle: false,
			helper: "original",
			iframeFix: false,
			opacity: false,
			refreshPositions: false,
			revert: false,
			revertDuration: 500,
			scope: "default",
			scroll: true,
			scrollSensitivity: 20,
			scrollSpeed: 20,
			snap: false,
			snapMode: "both",
			snapTolerance: 20,
			stack: false,
			zIndex: false,

			// Callbacks
			drag: null,
			start: null,
			stop: null
		},
		_create: function() {

			if ( this.options.helper === "original" ) {
				this._setPositionRelative();
			}
			if ( this.options.addClasses ) {
				this._addClass( "ui-draggable" );
			}
			this._setHandleClassName();

			this._mouseInit();
		},

		_setOption: function( key, value ) {
			this._super( key, value );
			if ( key === "handle" ) {
				this._removeHandleClassName();
				this._setHandleClassName();
			}
		},

		_destroy: function() {
			if ( ( this.helper || this.element ).is( ".ui-draggable-dragging" ) ) {
				this.destroyOnClear = true;
				return;
			}
			this._removeHandleClassName();
			this._mouseDestroy();
		},

		_mouseCapture: function( event ) {
			var o = this.options;

			// Among others, prevent a drag on a resizable-handle
			if ( this.helper || o.disabled ||
				$( event.target ).closest( ".ui-resizable-handle" ).length > 0 ) {
				return false;
			}

			//Quit if we're not on a valid handle
			this.handle = this._getHandle( event );
			if ( !this.handle ) {
				return false;
			}

			this._blurActiveElement( event );

			this._blockFrames( o.iframeFix === true ? "iframe" : o.iframeFix );

			return true;

		},

		_blockFrames: function( selector ) {
			this.iframeBlocks = this.document.find( selector ).map( function() {
				var iframe = $( this );

				return $( "<div>" )
				.css( "position", "absolute" )
				.appendTo( iframe.parent() )
				.outerWidth( iframe.outerWidth() )
				.outerHeight( iframe.outerHeight() )
				.offset( iframe.offset() )[ 0 ];
			} );
		},

		_unblockFrames: function() {
			if ( this.iframeBlocks ) {
				this.iframeBlocks.remove();
				delete this.iframeBlocks;
			}
		},

		_blurActiveElement: function( event ) {
			var activeElement = $.ui.safeActiveElement( this.document[ 0 ] ),
				target = $( event.target );

			// Don't blur if the event occurred on an element that is within
			// the currently focused element
			// See #10527, #12472
			if ( target.closest( activeElement ).length ) {
				return;
			}

			// Blur any element that currently has focus, see #4261
			$.ui.safeBlur( activeElement );
		},

		_mouseStart: function( event ) {

			var o = this.options;

			//Create and append the visible helper
			this.helper = this._createHelper( event );

			this._addClass( this.helper, "ui-draggable-dragging" );

			//Cache the helper size
			this._cacheHelperProportions();

			//If ddmanager is used for droppables, set the global draggable
			if ( $.ui.ddmanager ) {
				$.ui.ddmanager.current = this;
			}

			/*
		 * - Position generation -
		 * This block generates everything position related - it's the core of draggables.
		 */

			//Cache the margins of the original element
			this._cacheMargins();

			//Store the helper's css position
			this.cssPosition = this.helper.css( "position" );
			this.scrollParent = this.helper.scrollParent( true );
			this.offsetParent = this.helper.offsetParent();
			this.hasFixedAncestor = this.helper.parents().filter( function() {
				return $( this ).css( "position" ) === "fixed";
			} ).length > 0;

			//The element's absolute position on the page minus margins
			this.positionAbs = this.element.offset();
			this._refreshOffsets( event );

			//Generate the original position
			this.originalPosition = this.position = this._generatePosition( event, false );
			this.originalPageX = event.pageX;
			this.originalPageY = event.pageY;

			//Adjust the mouse offset relative to the helper if "cursorAt" is supplied
			if ( o.cursorAt ) {
				this._adjustOffsetFromHelper( o.cursorAt );
			}

			//Set a containment if given in the options
			this._setContainment();

			//Trigger event + callbacks
			if ( this._trigger( "start", event ) === false ) {
				this._clear();
				return false;
			}

			//Recache the helper size
			this._cacheHelperProportions();

			//Prepare the droppable offsets
			if ( $.ui.ddmanager && !o.dropBehaviour ) {
				$.ui.ddmanager.prepareOffsets( this, event );
			}

			// Execute the drag once - this causes the helper not to be visible before getting its
			// correct position
			this._mouseDrag( event, true );

			// If the ddmanager is used for droppables, inform the manager that dragging has started
			// (see #5003)
			if ( $.ui.ddmanager ) {
				$.ui.ddmanager.dragStart( this, event );
			}

			return true;
		},

		_refreshOffsets: function( event ) {
			this.offset = {
				top: this.positionAbs.top - this.margins.top,
				left: this.positionAbs.left - this.margins.left,
				scroll: false,
				parent: this._getParentOffset(),
				relative: this._getRelativeOffset()
			};

			this.offset.click = {
				left: event.pageX - this.offset.left,
				top: event.pageY - this.offset.top
			};
		},

		_mouseDrag: function( event, noPropagation ) {

			// reset any necessary cached properties (see #5009)
			if ( this.hasFixedAncestor ) {
				this.offset.parent = this._getParentOffset();
			}

			//Compute the helpers position
			this.position = this._generatePosition( event, true );
			this.positionAbs = this._convertPositionTo( "absolute" );

			//Call plugins and callbacks and use the resulting position if something is returned
			if ( !noPropagation ) {
				var ui = this._uiHash();
				if ( this._trigger( "drag", event, ui ) === false ) {
					this._mouseUp( new $.Event( "mouseup", event ) );
					return false;
				}
				this.position = ui.position;
			}

			this.helper[ 0 ].style.left = this.position.left + "px";
			this.helper[ 0 ].style.top = this.position.top + "px";

			if ( $.ui.ddmanager ) {
				$.ui.ddmanager.drag( this, event );
			}

			return false;
		},

		_mouseStop: function( event ) {

			//If we are using droppables, inform the manager about the drop
			var that = this,
				dropped = false;
			if ( $.ui.ddmanager && !this.options.dropBehaviour ) {
				dropped = $.ui.ddmanager.drop( this, event );
			}

			//if a drop comes from outside (a sortable)
			if ( this.dropped ) {
				dropped = this.dropped;
				this.dropped = false;
			}

			if ( ( this.options.revert === "invalid" && !dropped ) ||
				( this.options.revert === "valid" && dropped ) ||
				this.options.revert === true || ( typeof this.options.revert === "function" &&
					this.options.revert.call( this.element, dropped ) )
			) {
				$( this.helper ).animate(
					this.originalPosition,
					parseInt( this.options.revertDuration, 10 ),
					function() {
						if ( that._trigger( "stop", event ) !== false ) {
							that._clear();
						}
					}
				);
			} else {
				if ( this._trigger( "stop", event ) !== false ) {
					this._clear();
				}
			}

			return false;
		},

		_mouseUp: function( event ) {
			this._unblockFrames();

			// If the ddmanager is used for droppables, inform the manager that dragging has stopped
			// (see #5003)
			if ( $.ui.ddmanager ) {
				$.ui.ddmanager.dragStop( this, event );
			}

			// Only need to focus if the event occurred on the draggable itself, see #10527
			if ( this.handleElement.is( event.target ) ) {

				// The interaction is over; whether or not the click resulted in a drag,
				// focus the element
				this.element.trigger( "focus" );
			}

			return $.ui.mouse.prototype._mouseUp.call( this, event );
		},

		cancel: function() {

			if ( this.helper.is( ".ui-draggable-dragging" ) ) {
				this._mouseUp( new $.Event( "mouseup", { target: this.element[ 0 ] } ) );
			} else {
				this._clear();
			}

			return this;

		},

		_getHandle: function( event ) {
			return this.options.handle ?
				!!$( event.target ).closest( this.element.find( this.options.handle ) ).length :
				true;
		},

		_setHandleClassName: function() {
			this.handleElement = this.options.handle ?
				this.element.find( this.options.handle ) : this.element;
			this._addClass( this.handleElement, "ui-draggable-handle" );
		},

		_removeHandleClassName: function() {
			this._removeClass( this.handleElement, "ui-draggable-handle" );
		},

		_createHelper: function( event ) {

			var o = this.options,
				helperIsFunction = typeof o.helper === "function",
				helper = helperIsFunction ?
					$( o.helper.apply( this.element[ 0 ], [ event ] ) ) :
					( o.helper === "clone" ?
						this.element.clone().removeAttr( "id" ) :
						this.element );

			if ( !helper.parents( "body" ).length ) {
				helper.appendTo( ( o.appendTo === "parent" ?
					this.element[ 0 ].parentNode :
					o.appendTo ) );
			}

			// Http://bugs.jqueryui.com/ticket/9446
			// a helper function can return the original element
			// which wouldn't have been set to relative in _create
			if ( helperIsFunction && helper[ 0 ] === this.element[ 0 ] ) {
				this._setPositionRelative();
			}

			if ( helper[ 0 ] !== this.element[ 0 ] &&
				!( /(fixed|absolute)/ ).test( helper.css( "position" ) ) ) {
				helper.css( "position", "absolute" );
			}

			return helper;

		},

		_setPositionRelative: function() {
			if ( !( /^(?:r|a|f)/ ).test( this.element.css( "position" ) ) ) {
				this.element[ 0 ].style.position = "relative";
			}
		},

		_adjustOffsetFromHelper: function( obj ) {
			if ( typeof obj === "string" ) {
				obj = obj.split( " " );
			}
			if ( Array.isArray( obj ) ) {
				obj = { left: +obj[ 0 ], top: +obj[ 1 ] || 0 };
			}
			if ( "left" in obj ) {
				this.offset.click.left = obj.left + this.margins.left;
			}
			if ( "right" in obj ) {
				this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
			}
			if ( "top" in obj ) {
				this.offset.click.top = obj.top + this.margins.top;
			}
			if ( "bottom" in obj ) {
				this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
			}
		},

		_isRootNode: function( element ) {
			return ( /(html|body)/i ).test( element.tagName ) || element === this.document[ 0 ];
		},

		_getParentOffset: function() {

			//Get the offsetParent and cache its position
			var po = this.offsetParent.offset(),
				document = this.document[ 0 ];

			// This is a special case where we need to modify a offset calculated on start, since the
			// following happened:
			// 1. The position of the helper is absolute, so it's position is calculated based on the
			// next positioned parent
			// 2. The actual offset parent is a child of the scroll parent, and the scroll parent isn't
			// the document, which means that the scroll is included in the initial calculation of the
			// offset of the parent, and never recalculated upon drag
			if ( this.cssPosition === "absolute" && this.scrollParent[ 0 ] !== document &&
				$.contains( this.scrollParent[ 0 ], this.offsetParent[ 0 ] ) ) {
				po.left += this.scrollParent.scrollLeft();
				po.top += this.scrollParent.scrollTop();
			}

			if ( this._isRootNode( this.offsetParent[ 0 ] ) ) {
				po = { top: 0, left: 0 };
			}

			return {
				top: po.top + ( parseInt( this.offsetParent.css( "borderTopWidth" ), 10 ) || 0 ),
				left: po.left + ( parseInt( this.offsetParent.css( "borderLeftWidth" ), 10 ) || 0 )
			};

		},

		_getRelativeOffset: function() {
			if ( this.cssPosition !== "relative" ) {
				return { top: 0, left: 0 };
			}

			var p = this.element.position(),
				scrollIsRootNode = this._isRootNode( this.scrollParent[ 0 ] );

			return {
				top: p.top - ( parseInt( this.helper.css( "top" ), 10 ) || 0 ) +
					( !scrollIsRootNode ? this.scrollParent.scrollTop() : 0 ),
				left: p.left - ( parseInt( this.helper.css( "left" ), 10 ) || 0 ) +
					( !scrollIsRootNode ? this.scrollParent.scrollLeft() : 0 )
			};

		},

		_cacheMargins: function() {
			this.margins = {
				left: ( parseInt( this.element.css( "marginLeft" ), 10 ) || 0 ),
				top: ( parseInt( this.element.css( "marginTop" ), 10 ) || 0 ),
				right: ( parseInt( this.element.css( "marginRight" ), 10 ) || 0 ),
				bottom: ( parseInt( this.element.css( "marginBottom" ), 10 ) || 0 )
			};
		},

		_cacheHelperProportions: function() {
			this.helperProportions = {
				width: this.helper.outerWidth(),
				height: this.helper.outerHeight()
			};
		},

		_setContainment: function() {

			var isUserScrollable, c, ce,
				o = this.options,
				document = this.document[ 0 ];

			this.relativeContainer = null;

			if ( !o.containment ) {
				this.containment = null;
				return;
			}

			if ( o.containment === "window" ) {
				this.containment = [
					$( window ).scrollLeft() - this.offset.relative.left - this.offset.parent.left,
					$( window ).scrollTop() - this.offset.relative.top - this.offset.parent.top,
					$( window ).scrollLeft() + $( window ).width() -
					this.helperProportions.width - this.margins.left,
					$( window ).scrollTop() +
					( $( window ).height() || document.body.parentNode.scrollHeight ) -
					this.helperProportions.height - this.margins.top
				];
				return;
			}

			if ( o.containment === "document" ) {
				this.containment = [
					0,
					0,
					$( document ).width() - this.helperProportions.width - this.margins.left,
					( $( document ).height() || document.body.parentNode.scrollHeight ) -
					this.helperProportions.height - this.margins.top
				];
				return;
			}

			if ( o.containment.constructor === Array ) {
				this.containment = o.containment;
				return;
			}

			if ( o.containment === "parent" ) {
				o.containment = this.helper[ 0 ].parentNode;
			}

			c = $( o.containment );
			ce = c[ 0 ];

			if ( !ce ) {
				return;
			}

			isUserScrollable = /(scroll|auto)/.test( c.css( "overflow" ) );

			this.containment = [
				( parseInt( c.css( "borderLeftWidth" ), 10 ) || 0 ) +
				( parseInt( c.css( "paddingLeft" ), 10 ) || 0 ),
				( parseInt( c.css( "borderTopWidth" ), 10 ) || 0 ) +
				( parseInt( c.css( "paddingTop" ), 10 ) || 0 ),
				( isUserScrollable ? Math.max( ce.scrollWidth, ce.offsetWidth ) : ce.offsetWidth ) -
				( parseInt( c.css( "borderRightWidth" ), 10 ) || 0 ) -
				( parseInt( c.css( "paddingRight" ), 10 ) || 0 ) -
				this.helperProportions.width -
				this.margins.left -
				this.margins.right,
				( isUserScrollable ? Math.max( ce.scrollHeight, ce.offsetHeight ) : ce.offsetHeight ) -
				( parseInt( c.css( "borderBottomWidth" ), 10 ) || 0 ) -
				( parseInt( c.css( "paddingBottom" ), 10 ) || 0 ) -
				this.helperProportions.height -
				this.margins.top -
				this.margins.bottom
			];
			this.relativeContainer = c;
		},

		_convertPositionTo: function( d, pos ) {

			if ( !pos ) {
				pos = this.position;
			}

			var mod = d === "absolute" ? 1 : -1,
				scrollIsRootNode = this._isRootNode( this.scrollParent[ 0 ] );

			return {
				top: (

					// The absolute mouse position
					pos.top	+

					// Only for relative positioned nodes: Relative offset from element to offset parent
					this.offset.relative.top * mod +

					// The offsetParent's offset without borders (offset + border)
					this.offset.parent.top * mod -
					( ( this.cssPosition === "fixed" ?
						-this.offset.scroll.top :
						( scrollIsRootNode ? 0 : this.offset.scroll.top ) ) * mod )
				),
				left: (

					// The absolute mouse position
					pos.left +

					// Only for relative positioned nodes: Relative offset from element to offset parent
					this.offset.relative.left * mod +

					// The offsetParent's offset without borders (offset + border)
					this.offset.parent.left * mod	-
					( ( this.cssPosition === "fixed" ?
						-this.offset.scroll.left :
						( scrollIsRootNode ? 0 : this.offset.scroll.left ) ) * mod )
				)
			};

		},

		_generatePosition: function( event, constrainPosition ) {

			var containment, co, top, left,
				o = this.options,
				scrollIsRootNode = this._isRootNode( this.scrollParent[ 0 ] ),
				pageX = event.pageX,
				pageY = event.pageY;

			// Cache the scroll
			if ( !scrollIsRootNode || !this.offset.scroll ) {
				this.offset.scroll = {
					top: this.scrollParent.scrollTop(),
					left: this.scrollParent.scrollLeft()
				};
			}

			/*
		 * - Position constraining -
		 * Constrain the position to a mix of grid, containment.
		 */

			// If we are not dragging yet, we won't check for options
			if ( constrainPosition ) {
				if ( this.containment ) {
					if ( this.relativeContainer ) {
						co = this.relativeContainer.offset();
						containment = [
							this.containment[ 0 ] + co.left,
							this.containment[ 1 ] + co.top,
							this.containment[ 2 ] + co.left,
							this.containment[ 3 ] + co.top
						];
					} else {
						containment = this.containment;
					}

					if ( event.pageX - this.offset.click.left < containment[ 0 ] ) {
						pageX = containment[ 0 ] + this.offset.click.left;
					}
					if ( event.pageY - this.offset.click.top < containment[ 1 ] ) {
						pageY = containment[ 1 ] + this.offset.click.top;
					}
					if ( event.pageX - this.offset.click.left > containment[ 2 ] ) {
						pageX = containment[ 2 ] + this.offset.click.left;
					}
					if ( event.pageY - this.offset.click.top > containment[ 3 ] ) {
						pageY = containment[ 3 ] + this.offset.click.top;
					}
				}

				if ( o.grid ) {

					//Check for grid elements set to 0 to prevent divide by 0 error causing invalid
					// argument errors in IE (see ticket #6950)
					top = o.grid[ 1 ] ? this.originalPageY + Math.round( ( pageY -
						this.originalPageY ) / o.grid[ 1 ] ) * o.grid[ 1 ] : this.originalPageY;
					pageY = containment ? ( ( top - this.offset.click.top >= containment[ 1 ] ||
						top - this.offset.click.top > containment[ 3 ] ) ?
						top :
						( ( top - this.offset.click.top >= containment[ 1 ] ) ?
							top - o.grid[ 1 ] : top + o.grid[ 1 ] ) ) : top;

					left = o.grid[ 0 ] ? this.originalPageX +
						Math.round( ( pageX - this.originalPageX ) / o.grid[ 0 ] ) * o.grid[ 0 ] :
						this.originalPageX;
					pageX = containment ? ( ( left - this.offset.click.left >= containment[ 0 ] ||
						left - this.offset.click.left > containment[ 2 ] ) ?
						left :
						( ( left - this.offset.click.left >= containment[ 0 ] ) ?
							left - o.grid[ 0 ] : left + o.grid[ 0 ] ) ) : left;
				}

				if ( o.axis === "y" ) {
					pageX = this.originalPageX;
				}

				if ( o.axis === "x" ) {
					pageY = this.originalPageY;
				}
			}

			return {
				top: (

					// The absolute mouse position
					pageY -

					// Click offset (relative to the element)
					this.offset.click.top -

					// Only for relative positioned nodes: Relative offset from element to offset parent
					this.offset.relative.top -

					// The offsetParent's offset without borders (offset + border)
					this.offset.parent.top +
					( this.cssPosition === "fixed" ?
						-this.offset.scroll.top :
						( scrollIsRootNode ? 0 : this.offset.scroll.top ) )
				),
				left: (

					// The absolute mouse position
					pageX -

					// Click offset (relative to the element)
					this.offset.click.left -

					// Only for relative positioned nodes: Relative offset from element to offset parent
					this.offset.relative.left -

					// The offsetParent's offset without borders (offset + border)
					this.offset.parent.left +
					( this.cssPosition === "fixed" ?
						-this.offset.scroll.left :
						( scrollIsRootNode ? 0 : this.offset.scroll.left ) )
				)
			};

		},

		_clear: function() {
			this._removeClass( this.helper, "ui-draggable-dragging" );
			if ( this.helper[ 0 ] !== this.element[ 0 ] && !this.cancelHelperRemoval ) {
				this.helper.remove();
			}
			this.helper = null;
			this.cancelHelperRemoval = false;
			if ( this.destroyOnClear ) {
				this.destroy();
			}
		},

		// From now on bulk stuff - mainly helpers

		_trigger: function( type, event, ui ) {
			ui = ui || this._uiHash();
			$.ui.plugin.call( this, type, [ event, ui, this ], true );

			// Absolute position and offset (see #6884 ) have to be recalculated after plugins
			if ( /^(drag|start|stop)/.test( type ) ) {
				this.positionAbs = this._convertPositionTo( "absolute" );
				ui.offset = this.positionAbs;
			}
			return $.Widget.prototype._trigger.call( this, type, event, ui );
		},

		plugins: {},

		_uiHash: function() {
			return {
				helper: this.helper,
				position: this.position,
				originalPosition: this.originalPosition,
				offset: this.positionAbs
			};
		}

	} );

	$.ui.plugin.add( "draggable", "connectToSortable", {
		start: function( event, ui, draggable ) {
			var uiSortable = $.extend( {}, ui, {
				item: draggable.element
			} );

			draggable.sortables = [];
			$( draggable.options.connectToSortable ).each( function() {
				var sortable = $( this ).sortable( "instance" );

				if ( sortable && !sortable.options.disabled ) {
					draggable.sortables.push( sortable );

					// RefreshPositions is called at drag start to refresh the containerCache
					// which is used in drag. This ensures it's initialized and synchronized
					// with any changes that might have happened on the page since initialization.
					sortable.refreshPositions();
					sortable._trigger( "activate", event, uiSortable );
				}
			} );
		},
		stop: function( event, ui, draggable ) {
			var uiSortable = $.extend( {}, ui, {
				item: draggable.element
			} );

			draggable.cancelHelperRemoval = false;

			$.each( draggable.sortables, function() {
				var sortable = this;

				if ( sortable.isOver ) {
					sortable.isOver = 0;

					// Allow this sortable to handle removing the helper
					draggable.cancelHelperRemoval = true;
					sortable.cancelHelperRemoval = false;

					// Use _storedCSS To restore properties in the sortable,
					// as this also handles revert (#9675) since the draggable
					// may have modified them in unexpected ways (#8809)
					sortable._storedCSS = {
						position: sortable.placeholder.css( "position" ),
						top: sortable.placeholder.css( "top" ),
						left: sortable.placeholder.css( "left" )
					};

					sortable._mouseStop( event );

					// Once drag has ended, the sortable should return to using
					// its original helper, not the shared helper from draggable
					sortable.options.helper = sortable.options._helper;
				} else {

					// Prevent this Sortable from removing the helper.
					// However, don't set the draggable to remove the helper
					// either as another connected Sortable may yet handle the removal.
					sortable.cancelHelperRemoval = true;

					sortable._trigger( "deactivate", event, uiSortable );
				}
			} );
		},
		drag: function( event, ui, draggable ) {
			$.each( draggable.sortables, function() {
				var innermostIntersecting = false,
					sortable = this;

				// Copy over variables that sortable's _intersectsWith uses
				sortable.positionAbs = draggable.positionAbs;
				sortable.helperProportions = draggable.helperProportions;
				sortable.offset.click = draggable.offset.click;

				if ( sortable._intersectsWith( sortable.containerCache ) ) {
					innermostIntersecting = true;

					$.each( draggable.sortables, function() {

						// Copy over variables that sortable's _intersectsWith uses
						this.positionAbs = draggable.positionAbs;
						this.helperProportions = draggable.helperProportions;
						this.offset.click = draggable.offset.click;

						if ( this !== sortable &&
							this._intersectsWith( this.containerCache ) &&
							$.contains( sortable.element[ 0 ], this.element[ 0 ] ) ) {
							innermostIntersecting = false;
						}

						return innermostIntersecting;
					} );
				}

				if ( innermostIntersecting ) {

					// If it intersects, we use a little isOver variable and set it once,
					// so that the move-in stuff gets fired only once.
					if ( !sortable.isOver ) {
						sortable.isOver = 1;

						// Store draggable's parent in case we need to reappend to it later.
						draggable._parent = ui.helper.parent();

						sortable.currentItem = ui.helper
						.appendTo( sortable.element )
						.data( "ui-sortable-item", true );

						// Store helper option to later restore it
						sortable.options._helper = sortable.options.helper;

						sortable.options.helper = function() {
							return ui.helper[ 0 ];
						};

						// Fire the start events of the sortable with our passed browser event,
						// and our own helper (so it doesn't create a new one)
						event.target = sortable.currentItem[ 0 ];
						sortable._mouseCapture( event, true );
						sortable._mouseStart( event, true, true );

						// Because the browser event is way off the new appended portlet,
						// modify necessary variables to reflect the changes
						sortable.offset.click.top = draggable.offset.click.top;
						sortable.offset.click.left = draggable.offset.click.left;
						sortable.offset.parent.left -= draggable.offset.parent.left -
							sortable.offset.parent.left;
						sortable.offset.parent.top -= draggable.offset.parent.top -
							sortable.offset.parent.top;

						draggable._trigger( "toSortable", event );

						// Inform draggable that the helper is in a valid drop zone,
						// used solely in the revert option to handle "valid/invalid".
						draggable.dropped = sortable.element;

						// Need to refreshPositions of all sortables in the case that
						// adding to one sortable changes the location of the other sortables (#9675)
						$.each( draggable.sortables, function() {
							this.refreshPositions();
						} );

						// Hack so receive/update callbacks work (mostly)
						draggable.currentItem = draggable.element;
						sortable.fromOutside = draggable;
					}

					if ( sortable.currentItem ) {
						sortable._mouseDrag( event );

						// Copy the sortable's position because the draggable's can potentially reflect
						// a relative position, while sortable is always absolute, which the dragged
						// element has now become. (#8809)
						ui.position = sortable.position;
					}
				} else {

					// If it doesn't intersect with the sortable, and it intersected before,
					// we fake the drag stop of the sortable, but make sure it doesn't remove
					// the helper by using cancelHelperRemoval.
					if ( sortable.isOver ) {

						sortable.isOver = 0;
						sortable.cancelHelperRemoval = true;

						// Calling sortable's mouseStop would trigger a revert,
						// so revert must be temporarily false until after mouseStop is called.
						sortable.options._revert = sortable.options.revert;
						sortable.options.revert = false;

						sortable._trigger( "out", event, sortable._uiHash( sortable ) );
						sortable._mouseStop( event, true );

						// Restore sortable behaviors that were modfied
						// when the draggable entered the sortable area (#9481)
						sortable.options.revert = sortable.options._revert;
						sortable.options.helper = sortable.options._helper;

						if ( sortable.placeholder ) {
							sortable.placeholder.remove();
						}

						// Restore and recalculate the draggable's offset considering the sortable
						// may have modified them in unexpected ways. (#8809, #10669)
						ui.helper.appendTo( draggable._parent );
						draggable._refreshOffsets( event );
						ui.position = draggable._generatePosition( event, true );

						draggable._trigger( "fromSortable", event );

						// Inform draggable that the helper is no longer in a valid drop zone
						draggable.dropped = false;

						// Need to refreshPositions of all sortables just in case removing
						// from one sortable changes the location of other sortables (#9675)
						$.each( draggable.sortables, function() {
							this.refreshPositions();
						} );
					}
				}
			} );
		}
	} );

	$.ui.plugin.add( "draggable", "cursor", {
		start: function( event, ui, instance ) {
			var t = $( "body" ),
				o = instance.options;

			if ( t.css( "cursor" ) ) {
				o._cursor = t.css( "cursor" );
			}
			t.css( "cursor", o.cursor );
		},
		stop: function( event, ui, instance ) {
			var o = instance.options;
			if ( o._cursor ) {
				$( "body" ).css( "cursor", o._cursor );
			}
		}
	} );

	$.ui.plugin.add( "draggable", "opacity", {
		start: function( event, ui, instance ) {
			var t = $( ui.helper ),
				o = instance.options;
			if ( t.css( "opacity" ) ) {
				o._opacity = t.css( "opacity" );
			}
			t.css( "opacity", o.opacity );
		},
		stop: function( event, ui, instance ) {
			var o = instance.options;
			if ( o._opacity ) {
				$( ui.helper ).css( "opacity", o._opacity );
			}
		}
	} );

	$.ui.plugin.add( "draggable", "scroll", {
		start: function( event, ui, i ) {
			if ( !i.scrollParentNotHidden ) {
				i.scrollParentNotHidden = i.helper.scrollParent( false );
			}

			if ( i.scrollParentNotHidden[ 0 ] !== i.document[ 0 ] &&
				i.scrollParentNotHidden[ 0 ].tagName !== "HTML" ) {
				i.overflowOffset = i.scrollParentNotHidden.offset();
			}
		},
		drag: function( event, ui, i  ) {

			var o = i.options,
				scrolled = false,
				scrollParent = i.scrollParentNotHidden[ 0 ],
				document = i.document[ 0 ];

			if ( scrollParent !== document && scrollParent.tagName !== "HTML" ) {
				if ( !o.axis || o.axis !== "x" ) {
					if ( ( i.overflowOffset.top + scrollParent.offsetHeight ) - event.pageY <
						o.scrollSensitivity ) {
						scrollParent.scrollTop = scrolled = scrollParent.scrollTop + o.scrollSpeed;
					} else if ( event.pageY - i.overflowOffset.top < o.scrollSensitivity ) {
						scrollParent.scrollTop = scrolled = scrollParent.scrollTop - o.scrollSpeed;
					}
				}

				if ( !o.axis || o.axis !== "y" ) {
					if ( ( i.overflowOffset.left + scrollParent.offsetWidth ) - event.pageX <
						o.scrollSensitivity ) {
						scrollParent.scrollLeft = scrolled = scrollParent.scrollLeft + o.scrollSpeed;
					} else if ( event.pageX - i.overflowOffset.left < o.scrollSensitivity ) {
						scrollParent.scrollLeft = scrolled = scrollParent.scrollLeft - o.scrollSpeed;
					}
				}

			} else {

				if ( !o.axis || o.axis !== "x" ) {
					if ( event.pageY - $( document ).scrollTop() < o.scrollSensitivity ) {
						scrolled = $( document ).scrollTop( $( document ).scrollTop() - o.scrollSpeed );
					} else if ( $( window ).height() - ( event.pageY - $( document ).scrollTop() ) <
						o.scrollSensitivity ) {
						scrolled = $( document ).scrollTop( $( document ).scrollTop() + o.scrollSpeed );
					}
				}

				if ( !o.axis || o.axis !== "y" ) {
					if ( event.pageX - $( document ).scrollLeft() < o.scrollSensitivity ) {
						scrolled = $( document ).scrollLeft(
							$( document ).scrollLeft() - o.scrollSpeed
						);
					} else if ( $( window ).width() - ( event.pageX - $( document ).scrollLeft() ) <
						o.scrollSensitivity ) {
						scrolled = $( document ).scrollLeft(
							$( document ).scrollLeft() + o.scrollSpeed
						);
					}
				}

			}

			if ( scrolled !== false && $.ui.ddmanager && !o.dropBehaviour ) {
				$.ui.ddmanager.prepareOffsets( i, event );
			}

		}
	} );

	$.ui.plugin.add( "draggable", "snap", {
		start: function( event, ui, i ) {

			var o = i.options;

			i.snapElements = [];

			$( o.snap.constructor !== String ? ( o.snap.items || ":data(ui-draggable)" ) : o.snap )
			.each( function() {
				var $t = $( this ),
					$o = $t.offset();
				if ( this !== i.element[ 0 ] ) {
					i.snapElements.push( {
						item: this,
						width: $t.outerWidth(), height: $t.outerHeight(),
						top: $o.top, left: $o.left
					} );
				}
			} );

		},
		drag: function( event, ui, inst ) {

			var ts, bs, ls, rs, l, r, t, b, i, first,
				o = inst.options,
				d = o.snapTolerance,
				x1 = ui.offset.left, x2 = x1 + inst.helperProportions.width,
				y1 = ui.offset.top, y2 = y1 + inst.helperProportions.height;

			for ( i = inst.snapElements.length - 1; i >= 0; i-- ) {

				l = inst.snapElements[ i ].left - inst.margins.left;
				r = l + inst.snapElements[ i ].width;
				t = inst.snapElements[ i ].top - inst.margins.top;
				b = t + inst.snapElements[ i ].height;

				if ( x2 < l - d || x1 > r + d || y2 < t - d || y1 > b + d ||
					!$.contains( inst.snapElements[ i ].item.ownerDocument,
						inst.snapElements[ i ].item ) ) {
					if ( inst.snapElements[ i ].snapping ) {
						if ( inst.options.snap.release ) {
							inst.options.snap.release.call(
								inst.element,
								event,
								$.extend( inst._uiHash(), { snapItem: inst.snapElements[ i ].item } )
							);
						}
					}
					inst.snapElements[ i ].snapping = false;
					continue;
				}

				if ( o.snapMode !== "inner" ) {
					ts = Math.abs( t - y2 ) <= d;
					bs = Math.abs( b - y1 ) <= d;
					ls = Math.abs( l - x2 ) <= d;
					rs = Math.abs( r - x1 ) <= d;
					if ( ts ) {
						ui.position.top = inst._convertPositionTo( "relative", {
							top: t - inst.helperProportions.height,
							left: 0
						} ).top;
					}
					if ( bs ) {
						ui.position.top = inst._convertPositionTo( "relative", {
							top: b,
							left: 0
						} ).top;
					}
					if ( ls ) {
						ui.position.left = inst._convertPositionTo( "relative", {
							top: 0,
							left: l - inst.helperProportions.width
						} ).left;
					}
					if ( rs ) {
						ui.position.left = inst._convertPositionTo( "relative", {
							top: 0,
							left: r
						} ).left;
					}
				}

				first = ( ts || bs || ls || rs );

				if ( o.snapMode !== "outer" ) {
					ts = Math.abs( t - y1 ) <= d;
					bs = Math.abs( b - y2 ) <= d;
					ls = Math.abs( l - x1 ) <= d;
					rs = Math.abs( r - x2 ) <= d;
					if ( ts ) {
						ui.position.top = inst._convertPositionTo( "relative", {
							top: t,
							left: 0
						} ).top;
					}
					if ( bs ) {
						ui.position.top = inst._convertPositionTo( "relative", {
							top: b - inst.helperProportions.height,
							left: 0
						} ).top;
					}
					if ( ls ) {
						ui.position.left = inst._convertPositionTo( "relative", {
							top: 0,
							left: l
						} ).left;
					}
					if ( rs ) {
						ui.position.left = inst._convertPositionTo( "relative", {
							top: 0,
							left: r - inst.helperProportions.width
						} ).left;
					}
				}

				if ( !inst.snapElements[ i ].snapping && ( ts || bs || ls || rs || first ) ) {
					if ( inst.options.snap.snap ) {
						inst.options.snap.snap.call(
							inst.element,
							event,
							$.extend( inst._uiHash(), {
								snapItem: inst.snapElements[ i ].item
							} ) );
					}
				}
				inst.snapElements[ i ].snapping = ( ts || bs || ls || rs || first );

			}

		}
	} );

	$.ui.plugin.add( "draggable", "stack", {
		start: function( event, ui, instance ) {
			var min,
				o = instance.options,
				group = $.makeArray( $( o.stack ) ).sort( function( a, b ) {
					return ( parseInt( $( a ).css( "zIndex" ), 10 ) || 0 ) -
						( parseInt( $( b ).css( "zIndex" ), 10 ) || 0 );
				} );

			if ( !group.length ) {
				return;
			}

			min = parseInt( $( group[ 0 ] ).css( "zIndex" ), 10 ) || 0;
			$( group ).each( function( i ) {
				$( this ).css( "zIndex", min + i );
			} );
			this.css( "zIndex", ( min + group.length ) );
		}
	} );

	$.ui.plugin.add( "draggable", "zIndex", {
		start: function( event, ui, instance ) {
			var t = $( ui.helper ),
				o = instance.options;

			if ( t.css( "zIndex" ) ) {
				o._zIndex = t.css( "zIndex" );
			}
			t.css( "zIndex", o.zIndex );
		},
		stop: function( event, ui, instance ) {
			var o = instance.options;

			if ( o._zIndex ) {
				$( ui.helper ).css( "zIndex", o._zIndex );
			}
		}
	} );

	var widgetsDraggable = $.ui.draggable;


	/*!
 * jQuery UI Resizable 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Resizable
//>>group: Interactions
//>>description: Enables resize functionality for any element.
//>>docs: http://api.jqueryui.com/resizable/
//>>demos: http://jqueryui.com/resizable/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/resizable.css
//>>css.theme: ../../themes/base/theme.css


	$.widget( "ui.resizable", $.ui.mouse, {
		version: "1.13.0",
		widgetEventPrefix: "resize",
		options: {
			alsoResize: false,
			animate: false,
			animateDuration: "slow",
			animateEasing: "swing",
			aspectRatio: false,
			autoHide: false,
			classes: {
				"ui-resizable-se": "ui-icon ui-icon-gripsmall-diagonal-se"
			},
			containment: false,
			ghost: false,
			grid: false,
			handles: "e,s,se",
			helper: false,
			maxHeight: null,
			maxWidth: null,
			minHeight: 10,
			minWidth: 10,

			// See #7960
			zIndex: 90,

			// Callbacks
			resize: null,
			start: null,
			stop: null
		},

		_num: function( value ) {
			return parseFloat( value ) || 0;
		},

		_isNumber: function( value ) {
			return !isNaN( parseFloat( value ) );
		},

		_hasScroll: function( el, a ) {

			if ( $( el ).css( "overflow" ) === "hidden" ) {
				return false;
			}

			var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
				has = false;

			if ( el[ scroll ] > 0 ) {
				return true;
			}

			// TODO: determine which cases actually cause this to happen
			// if the element doesn't have the scroll set, see if it's possible to
			// set the scroll
			try {
				el[ scroll ] = 1;
				has = ( el[ scroll ] > 0 );
				el[ scroll ] = 0;
			} catch ( e ) {

				// `el` might be a string, then setting `scroll` will throw
				// an error in strict mode; ignore it.
			}
			return has;
		},

		_create: function() {

			var margins,
				o = this.options,
				that = this;
			this._addClass( "ui-resizable" );

			$.extend( this, {
				_aspectRatio: !!( o.aspectRatio ),
				aspectRatio: o.aspectRatio,
				originalElement: this.element,
				_proportionallyResizeElements: [],
				_helper: o.helper || o.ghost || o.animate ? o.helper || "ui-resizable-helper" : null
			} );

			// Wrap the element if it cannot hold child nodes
			if ( this.element[ 0 ].nodeName.match( /^(canvas|textarea|input|select|button|img)$/i ) ) {

				this.element.wrap(
					$( "<div class='ui-wrapper'></div>" ).css( {
						overflow: "hidden",
						position: this.element.css( "position" ),
						width: this.element.outerWidth(),
						height: this.element.outerHeight(),
						top: this.element.css( "top" ),
						left: this.element.css( "left" )
					} )
				);

				this.element = this.element.parent().data(
					"ui-resizable", this.element.resizable( "instance" )
				);

				this.elementIsWrapper = true;

				margins = {
					marginTop: this.originalElement.css( "marginTop" ),
					marginRight: this.originalElement.css( "marginRight" ),
					marginBottom: this.originalElement.css( "marginBottom" ),
					marginLeft: this.originalElement.css( "marginLeft" )
				};

				this.element.css( margins );
				this.originalElement.css( "margin", 0 );

				// support: Safari
				// Prevent Safari textarea resize
				this.originalResizeStyle = this.originalElement.css( "resize" );
				this.originalElement.css( "resize", "none" );

				this._proportionallyResizeElements.push( this.originalElement.css( {
					position: "static",
					zoom: 1,
					display: "block"
				} ) );

				// Support: IE9
				// avoid IE jump (hard set the margin)
				this.originalElement.css( margins );

				this._proportionallyResize();
			}

			this._setupHandles();

			if ( o.autoHide ) {
				$( this.element )
				.on( "mouseenter", function() {
					if ( o.disabled ) {
						return;
					}
					that._removeClass( "ui-resizable-autohide" );
					that._handles.show();
				} )
				.on( "mouseleave", function() {
					if ( o.disabled ) {
						return;
					}
					if ( !that.resizing ) {
						that._addClass( "ui-resizable-autohide" );
						that._handles.hide();
					}
				} );
			}

			this._mouseInit();
		},

		_destroy: function() {

			this._mouseDestroy();
			this._addedHandles.remove();

			var wrapper,
				_destroy = function( exp ) {
					$( exp )
					.removeData( "resizable" )
					.removeData( "ui-resizable" )
					.off( ".resizable" );
				};

			// TODO: Unwrap at same DOM position
			if ( this.elementIsWrapper ) {
				_destroy( this.element );
				wrapper = this.element;
				this.originalElement.css( {
					position: wrapper.css( "position" ),
					width: wrapper.outerWidth(),
					height: wrapper.outerHeight(),
					top: wrapper.css( "top" ),
					left: wrapper.css( "left" )
				} ).insertAfter( wrapper );
				wrapper.remove();
			}

			this.originalElement.css( "resize", this.originalResizeStyle );
			_destroy( this.originalElement );

			return this;
		},

		_setOption: function( key, value ) {
			this._super( key, value );

			switch ( key ) {
				case "handles":
					this._removeHandles();
					this._setupHandles();
					break;
				case "aspectRatio":
					this._aspectRatio = !!value;
					break;
				default:
					break;
			}
		},

		_setupHandles: function() {
			var o = this.options, handle, i, n, hname, axis, that = this;
			this.handles = o.handles ||
				( !$( ".ui-resizable-handle", this.element ).length ?
					"e,s,se" : {
						n: ".ui-resizable-n",
						e: ".ui-resizable-e",
						s: ".ui-resizable-s",
						w: ".ui-resizable-w",
						se: ".ui-resizable-se",
						sw: ".ui-resizable-sw",
						ne: ".ui-resizable-ne",
						nw: ".ui-resizable-nw"
					} );

			this._handles = $();
			this._addedHandles = $();
			if ( this.handles.constructor === String ) {

				if ( this.handles === "all" ) {
					this.handles = "n,e,s,w,se,sw,ne,nw";
				}

				n = this.handles.split( "," );
				this.handles = {};

				for ( i = 0; i < n.length; i++ ) {

					handle = String.prototype.trim.call( n[ i ] );
					hname = "ui-resizable-" + handle;
					axis = $( "<div>" );
					this._addClass( axis, "ui-resizable-handle " + hname );

					axis.css( { zIndex: o.zIndex } );

					this.handles[ handle ] = ".ui-resizable-" + handle;
					if ( !this.element.children( this.handles[ handle ] ).length ) {
						this.element.append( axis );
						this._addedHandles = this._addedHandles.add( axis );
					}
				}

			}

			this._renderAxis = function( target ) {

				var i, axis, padPos, padWrapper;

				target = target || this.element;

				for ( i in this.handles ) {

					if ( this.handles[ i ].constructor === String ) {
						this.handles[ i ] = this.element.children( this.handles[ i ] ).first().show();
					} else if ( this.handles[ i ].jquery || this.handles[ i ].nodeType ) {
						this.handles[ i ] = $( this.handles[ i ] );
						this._on( this.handles[ i ], { "mousedown": that._mouseDown } );
					}

					if ( this.elementIsWrapper &&
						this.originalElement[ 0 ]
						.nodeName
						.match( /^(textarea|input|select|button)$/i ) ) {
						axis = $( this.handles[ i ], this.element );

						padWrapper = /sw|ne|nw|se|n|s/.test( i ) ?
							axis.outerHeight() :
							axis.outerWidth();

						padPos = [ "padding",
							/ne|nw|n/.test( i ) ? "Top" :
								/se|sw|s/.test( i ) ? "Bottom" :
									/^e$/.test( i ) ? "Right" : "Left" ].join( "" );

						target.css( padPos, padWrapper );

						this._proportionallyResize();
					}

					this._handles = this._handles.add( this.handles[ i ] );
				}
			};

			// TODO: make renderAxis a prototype function
			this._renderAxis( this.element );

			this._handles = this._handles.add( this.element.find( ".ui-resizable-handle" ) );
			this._handles.disableSelection();

			this._handles.on( "mouseover", function() {
				if ( !that.resizing ) {
					if ( this.className ) {
						axis = this.className.match( /ui-resizable-(se|sw|ne|nw|n|e|s|w)/i );
					}
					that.axis = axis && axis[ 1 ] ? axis[ 1 ] : "se";
				}
			} );

			if ( o.autoHide ) {
				this._handles.hide();
				this._addClass( "ui-resizable-autohide" );
			}
		},

		_removeHandles: function() {
			this._addedHandles.remove();
		},

		_mouseCapture: function( event ) {
			var i, handle,
				capture = false;

			for ( i in this.handles ) {
				handle = $( this.handles[ i ] )[ 0 ];
				if ( handle === event.target || $.contains( handle, event.target ) ) {
					capture = true;
				}
			}

			return !this.options.disabled && capture;
		},

		_mouseStart: function( event ) {

			var curleft, curtop, cursor,
				o = this.options,
				el = this.element;

			this.resizing = true;

			this._renderProxy();

			curleft = this._num( this.helper.css( "left" ) );
			curtop = this._num( this.helper.css( "top" ) );

			if ( o.containment ) {
				curleft += $( o.containment ).scrollLeft() || 0;
				curtop += $( o.containment ).scrollTop() || 0;
			}

			this.offset = this.helper.offset();
			this.position = { left: curleft, top: curtop };

			this.size = this._helper ? {
				width: this.helper.width(),
				height: this.helper.height()
			} : {
				width: el.width(),
				height: el.height()
			};

			this.originalSize = this._helper ? {
				width: el.outerWidth(),
				height: el.outerHeight()
			} : {
				width: el.width(),
				height: el.height()
			};

			this.sizeDiff = {
				width: el.outerWidth() - el.width(),
				height: el.outerHeight() - el.height()
			};

			this.originalPosition = { left: curleft, top: curtop };
			this.originalMousePosition = { left: event.pageX, top: event.pageY };

			this.aspectRatio = ( typeof o.aspectRatio === "number" ) ?
				o.aspectRatio :
				( ( this.originalSize.width / this.originalSize.height ) || 1 );

			cursor = $( ".ui-resizable-" + this.axis ).css( "cursor" );
			$( "body" ).css( "cursor", cursor === "auto" ? this.axis + "-resize" : cursor );

			this._addClass( "ui-resizable-resizing" );
			this._propagate( "start", event );
			return true;
		},

		_mouseDrag: function( event ) {

			var data, props,
				smp = this.originalMousePosition,
				a = this.axis,
				dx = ( event.pageX - smp.left ) || 0,
				dy = ( event.pageY - smp.top ) || 0,
				trigger = this._change[ a ];

			this._updatePrevProperties();

			if ( !trigger ) {
				return false;
			}

			data = trigger.apply( this, [ event, dx, dy ] );

			this._updateVirtualBoundaries( event.shiftKey );
			if ( this._aspectRatio || event.shiftKey ) {
				data = this._updateRatio( data, event );
			}

			data = this._respectSize( data, event );

			this._updateCache( data );

			this._propagate( "resize", event );

			props = this._applyChanges();

			if ( !this._helper && this._proportionallyResizeElements.length ) {
				this._proportionallyResize();
			}

			if ( !$.isEmptyObject( props ) ) {
				this._updatePrevProperties();
				this._trigger( "resize", event, this.ui() );
				this._applyChanges();
			}

			return false;
		},

		_mouseStop: function( event ) {

			this.resizing = false;
			var pr, ista, soffseth, soffsetw, s, left, top,
				o = this.options, that = this;

			if ( this._helper ) {

				pr = this._proportionallyResizeElements;
				ista = pr.length && ( /textarea/i ).test( pr[ 0 ].nodeName );
				soffseth = ista && this._hasScroll( pr[ 0 ], "left" ) ? 0 : that.sizeDiff.height;
				soffsetw = ista ? 0 : that.sizeDiff.width;

				s = {
					width: ( that.helper.width()  - soffsetw ),
					height: ( that.helper.height() - soffseth )
				};
				left = ( parseFloat( that.element.css( "left" ) ) +
					( that.position.left - that.originalPosition.left ) ) || null;
				top = ( parseFloat( that.element.css( "top" ) ) +
					( that.position.top - that.originalPosition.top ) ) || null;

				if ( !o.animate ) {
					this.element.css( $.extend( s, { top: top, left: left } ) );
				}

				that.helper.height( that.size.height );
				that.helper.width( that.size.width );

				if ( this._helper && !o.animate ) {
					this._proportionallyResize();
				}
			}

			$( "body" ).css( "cursor", "auto" );

			this._removeClass( "ui-resizable-resizing" );

			this._propagate( "stop", event );

			if ( this._helper ) {
				this.helper.remove();
			}

			return false;

		},

		_updatePrevProperties: function() {
			this.prevPosition = {
				top: this.position.top,
				left: this.position.left
			};
			this.prevSize = {
				width: this.size.width,
				height: this.size.height
			};
		},

		_applyChanges: function() {
			var props = {};

			if ( this.position.top !== this.prevPosition.top ) {
				props.top = this.position.top + "px";
			}
			if ( this.position.left !== this.prevPosition.left ) {
				props.left = this.position.left + "px";
			}
			if ( this.size.width !== this.prevSize.width ) {
				props.width = this.size.width + "px";
			}
			if ( this.size.height !== this.prevSize.height ) {
				props.height = this.size.height + "px";
			}

			this.helper.css( props );

			return props;
		},

		_updateVirtualBoundaries: function( forceAspectRatio ) {
			var pMinWidth, pMaxWidth, pMinHeight, pMaxHeight, b,
				o = this.options;

			b = {
				minWidth: this._isNumber( o.minWidth ) ? o.minWidth : 0,
				maxWidth: this._isNumber( o.maxWidth ) ? o.maxWidth : Infinity,
				minHeight: this._isNumber( o.minHeight ) ? o.minHeight : 0,
				maxHeight: this._isNumber( o.maxHeight ) ? o.maxHeight : Infinity
			};

			if ( this._aspectRatio || forceAspectRatio ) {
				pMinWidth = b.minHeight * this.aspectRatio;
				pMinHeight = b.minWidth / this.aspectRatio;
				pMaxWidth = b.maxHeight * this.aspectRatio;
				pMaxHeight = b.maxWidth / this.aspectRatio;

				if ( pMinWidth > b.minWidth ) {
					b.minWidth = pMinWidth;
				}
				if ( pMinHeight > b.minHeight ) {
					b.minHeight = pMinHeight;
				}
				if ( pMaxWidth < b.maxWidth ) {
					b.maxWidth = pMaxWidth;
				}
				if ( pMaxHeight < b.maxHeight ) {
					b.maxHeight = pMaxHeight;
				}
			}
			this._vBoundaries = b;
		},

		_updateCache: function( data ) {
			this.offset = this.helper.offset();
			if ( this._isNumber( data.left ) ) {
				this.position.left = data.left;
			}
			if ( this._isNumber( data.top ) ) {
				this.position.top = data.top;
			}
			if ( this._isNumber( data.height ) ) {
				this.size.height = data.height;
			}
			if ( this._isNumber( data.width ) ) {
				this.size.width = data.width;
			}
		},

		_updateRatio: function( data ) {

			var cpos = this.position,
				csize = this.size,
				a = this.axis;

			if ( this._isNumber( data.height ) ) {
				data.width = ( data.height * this.aspectRatio );
			} else if ( this._isNumber( data.width ) ) {
				data.height = ( data.width / this.aspectRatio );
			}

			if ( a === "sw" ) {
				data.left = cpos.left + ( csize.width - data.width );
				data.top = null;
			}
			if ( a === "nw" ) {
				data.top = cpos.top + ( csize.height - data.height );
				data.left = cpos.left + ( csize.width - data.width );
			}

			return data;
		},

		_respectSize: function( data ) {

			var o = this._vBoundaries,
				a = this.axis,
				ismaxw = this._isNumber( data.width ) && o.maxWidth && ( o.maxWidth < data.width ),
				ismaxh = this._isNumber( data.height ) && o.maxHeight && ( o.maxHeight < data.height ),
				isminw = this._isNumber( data.width ) && o.minWidth && ( o.minWidth > data.width ),
				isminh = this._isNumber( data.height ) && o.minHeight && ( o.minHeight > data.height ),
				dw = this.originalPosition.left + this.originalSize.width,
				dh = this.originalPosition.top + this.originalSize.height,
				cw = /sw|nw|w/.test( a ), ch = /nw|ne|n/.test( a );
			if ( isminw ) {
				data.width = o.minWidth;
			}
			if ( isminh ) {
				data.height = o.minHeight;
			}
			if ( ismaxw ) {
				data.width = o.maxWidth;
			}
			if ( ismaxh ) {
				data.height = o.maxHeight;
			}

			if ( isminw && cw ) {
				data.left = dw - o.minWidth;
			}
			if ( ismaxw && cw ) {
				data.left = dw - o.maxWidth;
			}
			if ( isminh && ch ) {
				data.top = dh - o.minHeight;
			}
			if ( ismaxh && ch ) {
				data.top = dh - o.maxHeight;
			}

			// Fixing jump error on top/left - bug #2330
			if ( !data.width && !data.height && !data.left && data.top ) {
				data.top = null;
			} else if ( !data.width && !data.height && !data.top && data.left ) {
				data.left = null;
			}

			return data;
		},

		_getPaddingPlusBorderDimensions: function( element ) {
			var i = 0,
				widths = [],
				borders = [
					element.css( "borderTopWidth" ),
					element.css( "borderRightWidth" ),
					element.css( "borderBottomWidth" ),
					element.css( "borderLeftWidth" )
				],
				paddings = [
					element.css( "paddingTop" ),
					element.css( "paddingRight" ),
					element.css( "paddingBottom" ),
					element.css( "paddingLeft" )
				];

			for ( ; i < 4; i++ ) {
				widths[ i ] = ( parseFloat( borders[ i ] ) || 0 );
				widths[ i ] += ( parseFloat( paddings[ i ] ) || 0 );
			}

			return {
				height: widths[ 0 ] + widths[ 2 ],
				width: widths[ 1 ] + widths[ 3 ]
			};
		},

		_proportionallyResize: function() {

			if ( !this._proportionallyResizeElements.length ) {
				return;
			}

			var prel,
				i = 0,
				element = this.helper || this.element;

			for ( ; i < this._proportionallyResizeElements.length; i++ ) {

				prel = this._proportionallyResizeElements[ i ];

				// TODO: Seems like a bug to cache this.outerDimensions
				// considering that we are in a loop.
				if ( !this.outerDimensions ) {
					this.outerDimensions = this._getPaddingPlusBorderDimensions( prel );
				}

				prel.css( {
					height: ( element.height() - this.outerDimensions.height ) || 0,
					width: ( element.width() - this.outerDimensions.width ) || 0
				} );

			}

		},

		_renderProxy: function() {

			var el = this.element, o = this.options;
			this.elementOffset = el.offset();

			if ( this._helper ) {

				this.helper = this.helper || $( "<div></div>" ).css( { overflow: "hidden" } );

				this._addClass( this.helper, this._helper );
				this.helper.css( {
					width: this.element.outerWidth(),
					height: this.element.outerHeight(),
					position: "absolute",
					left: this.elementOffset.left + "px",
					top: this.elementOffset.top + "px",
					zIndex: ++o.zIndex //TODO: Don't modify option
				} );

				this.helper
				.appendTo( "body" )
				.disableSelection();

			} else {
				this.helper = this.element;
			}

		},

		_change: {
			e: function( event, dx ) {
				return { width: this.originalSize.width + dx };
			},
			w: function( event, dx ) {
				var cs = this.originalSize, sp = this.originalPosition;
				return { left: sp.left + dx, width: cs.width - dx };
			},
			n: function( event, dx, dy ) {
				var cs = this.originalSize, sp = this.originalPosition;
				return { top: sp.top + dy, height: cs.height - dy };
			},
			s: function( event, dx, dy ) {
				return { height: this.originalSize.height + dy };
			},
			se: function( event, dx, dy ) {
				return $.extend( this._change.s.apply( this, arguments ),
					this._change.e.apply( this, [ event, dx, dy ] ) );
			},
			sw: function( event, dx, dy ) {
				return $.extend( this._change.s.apply( this, arguments ),
					this._change.w.apply( this, [ event, dx, dy ] ) );
			},
			ne: function( event, dx, dy ) {
				return $.extend( this._change.n.apply( this, arguments ),
					this._change.e.apply( this, [ event, dx, dy ] ) );
			},
			nw: function( event, dx, dy ) {
				return $.extend( this._change.n.apply( this, arguments ),
					this._change.w.apply( this, [ event, dx, dy ] ) );
			}
		},

		_propagate: function( n, event ) {
			$.ui.plugin.call( this, n, [ event, this.ui() ] );
			if ( n !== "resize" ) {
				this._trigger( n, event, this.ui() );
			}
		},

		plugins: {},

		ui: function() {
			return {
				originalElement: this.originalElement,
				element: this.element,
				helper: this.helper,
				position: this.position,
				size: this.size,
				originalSize: this.originalSize,
				originalPosition: this.originalPosition
			};
		}

	} );

	/*
 * Resizable Extensions
 */

	$.ui.plugin.add( "resizable", "animate", {

		stop: function( event ) {
			var that = $( this ).resizable( "instance" ),
				o = that.options,
				pr = that._proportionallyResizeElements,
				ista = pr.length && ( /textarea/i ).test( pr[ 0 ].nodeName ),
				soffseth = ista && that._hasScroll( pr[ 0 ], "left" ) ? 0 : that.sizeDiff.height,
				soffsetw = ista ? 0 : that.sizeDiff.width,
				style = {
					width: ( that.size.width - soffsetw ),
					height: ( that.size.height - soffseth )
				},
				left = ( parseFloat( that.element.css( "left" ) ) +
					( that.position.left - that.originalPosition.left ) ) || null,
				top = ( parseFloat( that.element.css( "top" ) ) +
					( that.position.top - that.originalPosition.top ) ) || null;

			that.element.animate(
				$.extend( style, top && left ? { top: top, left: left } : {} ), {
					duration: o.animateDuration,
					easing: o.animateEasing,
					step: function() {

						var data = {
							width: parseFloat( that.element.css( "width" ) ),
							height: parseFloat( that.element.css( "height" ) ),
							top: parseFloat( that.element.css( "top" ) ),
							left: parseFloat( that.element.css( "left" ) )
						};

						if ( pr && pr.length ) {
							$( pr[ 0 ] ).css( { width: data.width, height: data.height } );
						}

						// Propagating resize, and updating values for each animation step
						that._updateCache( data );
						that._propagate( "resize", event );

					}
				}
			);
		}

	} );

	$.ui.plugin.add( "resizable", "containment", {

		start: function() {
			var element, p, co, ch, cw, width, height,
				that = $( this ).resizable( "instance" ),
				o = that.options,
				el = that.element,
				oc = o.containment,
				ce = ( oc instanceof $ ) ?
					oc.get( 0 ) :
					( /parent/.test( oc ) ) ? el.parent().get( 0 ) : oc;

			if ( !ce ) {
				return;
			}

			that.containerElement = $( ce );

			if ( /document/.test( oc ) || oc === document ) {
				that.containerOffset = {
					left: 0,
					top: 0
				};
				that.containerPosition = {
					left: 0,
					top: 0
				};

				that.parentData = {
					element: $( document ),
					left: 0,
					top: 0,
					width: $( document ).width(),
					height: $( document ).height() || document.body.parentNode.scrollHeight
				};
			} else {
				element = $( ce );
				p = [];
				$( [ "Top", "Right", "Left", "Bottom" ] ).each( function( i, name ) {
					p[ i ] = that._num( element.css( "padding" + name ) );
				} );

				that.containerOffset = element.offset();
				that.containerPosition = element.position();
				that.containerSize = {
					height: ( element.innerHeight() - p[ 3 ] ),
					width: ( element.innerWidth() - p[ 1 ] )
				};

				co = that.containerOffset;
				ch = that.containerSize.height;
				cw = that.containerSize.width;
				width = ( that._hasScroll( ce, "left" ) ? ce.scrollWidth : cw );
				height = ( that._hasScroll( ce ) ? ce.scrollHeight : ch );

				that.parentData = {
					element: ce,
					left: co.left,
					top: co.top,
					width: width,
					height: height
				};
			}
		},

		resize: function( event ) {
			var woset, hoset, isParent, isOffsetRelative,
				that = $( this ).resizable( "instance" ),
				o = that.options,
				co = that.containerOffset,
				cp = that.position,
				pRatio = that._aspectRatio || event.shiftKey,
				cop = {
					top: 0,
					left: 0
				},
				ce = that.containerElement,
				continueResize = true;

			if ( ce[ 0 ] !== document && ( /static/ ).test( ce.css( "position" ) ) ) {
				cop = co;
			}

			if ( cp.left < ( that._helper ? co.left : 0 ) ) {
				that.size.width = that.size.width +
					( that._helper ?
						( that.position.left - co.left ) :
						( that.position.left - cop.left ) );

				if ( pRatio ) {
					that.size.height = that.size.width / that.aspectRatio;
					continueResize = false;
				}
				that.position.left = o.helper ? co.left : 0;
			}

			if ( cp.top < ( that._helper ? co.top : 0 ) ) {
				that.size.height = that.size.height +
					( that._helper ?
						( that.position.top - co.top ) :
						that.position.top );

				if ( pRatio ) {
					that.size.width = that.size.height * that.aspectRatio;
					continueResize = false;
				}
				that.position.top = that._helper ? co.top : 0;
			}

			isParent = that.containerElement.get( 0 ) === that.element.parent().get( 0 );
			isOffsetRelative = /relative|absolute/.test( that.containerElement.css( "position" ) );

			if ( isParent && isOffsetRelative ) {
				that.offset.left = that.parentData.left + that.position.left;
				that.offset.top = that.parentData.top + that.position.top;
			} else {
				that.offset.left = that.element.offset().left;
				that.offset.top = that.element.offset().top;
			}

			woset = Math.abs( that.sizeDiff.width +
				( that._helper ?
					that.offset.left - cop.left :
					( that.offset.left - co.left ) ) );

			hoset = Math.abs( that.sizeDiff.height +
				( that._helper ?
					that.offset.top - cop.top :
					( that.offset.top - co.top ) ) );

			if ( woset + that.size.width >= that.parentData.width ) {
				that.size.width = that.parentData.width - woset;
				if ( pRatio ) {
					that.size.height = that.size.width / that.aspectRatio;
					continueResize = false;
				}
			}

			if ( hoset + that.size.height >= that.parentData.height ) {
				that.size.height = that.parentData.height - hoset;
				if ( pRatio ) {
					that.size.width = that.size.height * that.aspectRatio;
					continueResize = false;
				}
			}

			if ( !continueResize ) {
				that.position.left = that.prevPosition.left;
				that.position.top = that.prevPosition.top;
				that.size.width = that.prevSize.width;
				that.size.height = that.prevSize.height;
			}
		},

		stop: function() {
			var that = $( this ).resizable( "instance" ),
				o = that.options,
				co = that.containerOffset,
				cop = that.containerPosition,
				ce = that.containerElement,
				helper = $( that.helper ),
				ho = helper.offset(),
				w = helper.outerWidth() - that.sizeDiff.width,
				h = helper.outerHeight() - that.sizeDiff.height;

			if ( that._helper && !o.animate && ( /relative/ ).test( ce.css( "position" ) ) ) {
				$( this ).css( {
					left: ho.left - cop.left - co.left,
					width: w,
					height: h
				} );
			}

			if ( that._helper && !o.animate && ( /static/ ).test( ce.css( "position" ) ) ) {
				$( this ).css( {
					left: ho.left - cop.left - co.left,
					width: w,
					height: h
				} );
			}
		}
	} );

	$.ui.plugin.add( "resizable", "alsoResize", {

		start: function() {
			var that = $( this ).resizable( "instance" ),
				o = that.options;

			$( o.alsoResize ).each( function() {
				var el = $( this );
				el.data( "ui-resizable-alsoresize", {
					width: parseFloat( el.width() ), height: parseFloat( el.height() ),
					left: parseFloat( el.css( "left" ) ), top: parseFloat( el.css( "top" ) )
				} );
			} );
		},

		resize: function( event, ui ) {
			var that = $( this ).resizable( "instance" ),
				o = that.options,
				os = that.originalSize,
				op = that.originalPosition,
				delta = {
					height: ( that.size.height - os.height ) || 0,
					width: ( that.size.width - os.width ) || 0,
					top: ( that.position.top - op.top ) || 0,
					left: ( that.position.left - op.left ) || 0
				};

			$( o.alsoResize ).each( function() {
				var el = $( this ), start = $( this ).data( "ui-resizable-alsoresize" ), style = {},
					css = el.parents( ui.originalElement[ 0 ] ).length ?
						[ "width", "height" ] :
						[ "width", "height", "top", "left" ];

				$.each( css, function( i, prop ) {
					var sum = ( start[ prop ] || 0 ) + ( delta[ prop ] || 0 );
					if ( sum && sum >= 0 ) {
						style[ prop ] = sum || null;
					}
				} );

				el.css( style );
			} );
		},

		stop: function() {
			$( this ).removeData( "ui-resizable-alsoresize" );
		}
	} );

	$.ui.plugin.add( "resizable", "ghost", {

		start: function() {

			var that = $( this ).resizable( "instance" ), cs = that.size;

			that.ghost = that.originalElement.clone();
			that.ghost.css( {
				opacity: 0.25,
				display: "block",
				position: "relative",
				height: cs.height,
				width: cs.width,
				margin: 0,
				left: 0,
				top: 0
			} );

			that._addClass( that.ghost, "ui-resizable-ghost" );

			// DEPRECATED
			// TODO: remove after 1.12
			if ( $.uiBackCompat !== false && typeof that.options.ghost === "string" ) {

				// Ghost option
				that.ghost.addClass( this.options.ghost );
			}

			that.ghost.appendTo( that.helper );

		},

		resize: function() {
			var that = $( this ).resizable( "instance" );
			if ( that.ghost ) {
				that.ghost.css( {
					position: "relative",
					height: that.size.height,
					width: that.size.width
				} );
			}
		},

		stop: function() {
			var that = $( this ).resizable( "instance" );
			if ( that.ghost && that.helper ) {
				that.helper.get( 0 ).removeChild( that.ghost.get( 0 ) );
			}
		}

	} );

	$.ui.plugin.add( "resizable", "grid", {

		resize: function() {
			var outerDimensions,
				that = $( this ).resizable( "instance" ),
				o = that.options,
				cs = that.size,
				os = that.originalSize,
				op = that.originalPosition,
				a = that.axis,
				grid = typeof o.grid === "number" ? [ o.grid, o.grid ] : o.grid,
				gridX = ( grid[ 0 ] || 1 ),
				gridY = ( grid[ 1 ] || 1 ),
				ox = Math.round( ( cs.width - os.width ) / gridX ) * gridX,
				oy = Math.round( ( cs.height - os.height ) / gridY ) * gridY,
				newWidth = os.width + ox,
				newHeight = os.height + oy,
				isMaxWidth = o.maxWidth && ( o.maxWidth < newWidth ),
				isMaxHeight = o.maxHeight && ( o.maxHeight < newHeight ),
				isMinWidth = o.minWidth && ( o.minWidth > newWidth ),
				isMinHeight = o.minHeight && ( o.minHeight > newHeight );

			o.grid = grid;

			if ( isMinWidth ) {
				newWidth += gridX;
			}
			if ( isMinHeight ) {
				newHeight += gridY;
			}
			if ( isMaxWidth ) {
				newWidth -= gridX;
			}
			if ( isMaxHeight ) {
				newHeight -= gridY;
			}

			if ( /^(se|s|e)$/.test( a ) ) {
				that.size.width = newWidth;
				that.size.height = newHeight;
			} else if ( /^(ne)$/.test( a ) ) {
				that.size.width = newWidth;
				that.size.height = newHeight;
				that.position.top = op.top - oy;
			} else if ( /^(sw)$/.test( a ) ) {
				that.size.width = newWidth;
				that.size.height = newHeight;
				that.position.left = op.left - ox;
			} else {
				if ( newHeight - gridY <= 0 || newWidth - gridX <= 0 ) {
					outerDimensions = that._getPaddingPlusBorderDimensions( this );
				}

				if ( newHeight - gridY > 0 ) {
					that.size.height = newHeight;
					that.position.top = op.top - oy;
				} else {
					newHeight = gridY - outerDimensions.height;
					that.size.height = newHeight;
					that.position.top = op.top + os.height - newHeight;
				}
				if ( newWidth - gridX > 0 ) {
					that.size.width = newWidth;
					that.position.left = op.left - ox;
				} else {
					newWidth = gridX - outerDimensions.width;
					that.size.width = newWidth;
					that.position.left = op.left + os.width - newWidth;
				}
			}
		}

	} );

	var widgetsResizable = $.ui.resizable;


	/*!
 * jQuery UI Dialog 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Dialog
//>>group: Widgets
//>>description: Displays customizable dialog windows.
//>>docs: http://api.jqueryui.com/dialog/
//>>demos: http://jqueryui.com/dialog/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/dialog.css
//>>css.theme: ../../themes/base/theme.css


	$.widget( "ui.dialog", {
		version: "1.13.0",
		options: {
			appendTo: "body",
			autoOpen: true,
			buttons: [],
			classes: {
				"ui-dialog": "ui-corner-all",
				"ui-dialog-titlebar": "ui-corner-all"
			},
			closeOnEscape: true,
			closeText: "Close",
			draggable: true,
			hide: null,
			height: "auto",
			maxHeight: null,
			maxWidth: null,
			minHeight: 150,
			minWidth: 150,
			modal: false,
			position: {
				my: "center",
				at: "center",
				of: window,
				collision: "fit",

				// Ensure the titlebar is always visible
				using: function( pos ) {
					var topOffset = $( this ).css( pos ).offset().top;
					if ( topOffset < 0 ) {
						$( this ).css( "top", pos.top - topOffset );
					}
				}
			},
			resizable: true,
			show: null,
			title: null,
			width: 300,

			// Callbacks
			beforeClose: null,
			close: null,
			drag: null,
			dragStart: null,
			dragStop: null,
			focus: null,
			open: null,
			resize: null,
			resizeStart: null,
			resizeStop: null
		},

		sizeRelatedOptions: {
			buttons: true,
			height: true,
			maxHeight: true,
			maxWidth: true,
			minHeight: true,
			minWidth: true,
			width: true
		},

		resizableRelatedOptions: {
			maxHeight: true,
			maxWidth: true,
			minHeight: true,
			minWidth: true
		},

		_create: function() {
			this.originalCss = {
				display: this.element[ 0 ].style.display,
				width: this.element[ 0 ].style.width,
				minHeight: this.element[ 0 ].style.minHeight,
				maxHeight: this.element[ 0 ].style.maxHeight,
				height: this.element[ 0 ].style.height
			};
			this.originalPosition = {
				parent: this.element.parent(),
				index: this.element.parent().children().index( this.element )
			};
			this.originalTitle = this.element.attr( "title" );
			if ( this.options.title == null && this.originalTitle != null ) {
				this.options.title = this.originalTitle;
			}

			// Dialogs can't be disabled
			if ( this.options.disabled ) {
				this.options.disabled = false;
			}

			this._createWrapper();

			this.element
			.show()
			.removeAttr( "title" )
			.appendTo( this.uiDialog );

			this._addClass( "ui-dialog-content", "ui-widget-content" );

			this._createTitlebar();
			this._createButtonPane();

			if ( this.options.draggable && $.fn.draggable ) {
				this._makeDraggable();
			}
			if ( this.options.resizable && $.fn.resizable ) {
				this._makeResizable();
			}

			this._isOpen = false;

			this._trackFocus();
		},

		_init: function() {
			if ( this.options.autoOpen ) {
				this.open();
			}
		},

		_appendTo: function() {
			var element = this.options.appendTo;
			if ( element && ( element.jquery || element.nodeType ) ) {
				return $( element );
			}
			return this.document.find( element || "body" ).eq( 0 );
		},

		_destroy: function() {
			var next,
				originalPosition = this.originalPosition;

			this._untrackInstance();
			this._destroyOverlay();

			this.element
			.removeUniqueId()
			.css( this.originalCss )

			// Without detaching first, the following becomes really slow
			.detach();

			this.uiDialog.remove();

			if ( this.originalTitle ) {
				this.element.attr( "title", this.originalTitle );
			}

			next = originalPosition.parent.children().eq( originalPosition.index );

			// Don't try to place the dialog next to itself (#8613)
			if ( next.length && next[ 0 ] !== this.element[ 0 ] ) {
				next.before( this.element );
			} else {
				originalPosition.parent.append( this.element );
			}
		},

		widget: function() {
			return this.uiDialog;
		},

		disable: $.noop,
		enable: $.noop,

		close: function( event ) {
			var that = this;

			if ( !this._isOpen || this._trigger( "beforeClose", event ) === false ) {
				return;
			}

			this._isOpen = false;
			this._focusedElement = null;
			this._destroyOverlay();
			this._untrackInstance();

			if ( !this.opener.filter( ":focusable" ).trigger( "focus" ).length ) {

				// Hiding a focused element doesn't trigger blur in WebKit
				// so in case we have nothing to focus on, explicitly blur the active element
				// https://bugs.webkit.org/show_bug.cgi?id=47182
				$.ui.safeBlur( $.ui.safeActiveElement( this.document[ 0 ] ) );
			}

			this._hide( this.uiDialog, this.options.hide, function() {
				that._trigger( "close", event );
			} );
		},

		isOpen: function() {
			return this._isOpen;
		},

		moveToTop: function() {
			this._moveToTop();
		},

		_moveToTop: function( event, silent ) {
			var moved = false,
				zIndices = this.uiDialog.siblings( ".ui-front:visible" ).map( function() {
					return +$( this ).css( "z-index" );
				} ).get(),
				zIndexMax = Math.max.apply( null, zIndices );

			if ( zIndexMax >= +this.uiDialog.css( "z-index" ) ) {
				this.uiDialog.css( "z-index", zIndexMax + 1 );
				moved = true;
			}

			if ( moved && !silent ) {
				this._trigger( "focus", event );
			}
			return moved;
		},

		open: function() {
			var that = this;
			if ( this._isOpen ) {
				if ( this._moveToTop() ) {
					this._focusTabbable();
				}
				return;
			}

			this._isOpen = true;
			this.opener = $( $.ui.safeActiveElement( this.document[ 0 ] ) );

			this._size();
			this._position();
			this._createOverlay();
			this._moveToTop( null, true );

			// Ensure the overlay is moved to the top with the dialog, but only when
			// opening. The overlay shouldn't move after the dialog is open so that
			// modeless dialogs opened after the modal dialog stack properly.
			if ( this.overlay ) {
				this.overlay.css( "z-index", this.uiDialog.css( "z-index" ) - 1 );
			}

			this._show( this.uiDialog, this.options.show, function() {
				that._focusTabbable();
				that._trigger( "focus" );
			} );

			// Track the dialog immediately upon opening in case a focus event
			// somehow occurs outside of the dialog before an element inside the
			// dialog is focused (#10152)
			this._makeFocusTarget();

			this._trigger( "open" );
		},

		_focusTabbable: function() {

			// Set focus to the first match:
			// 1. An element that was focused previously
			// 2. First element inside the dialog matching [autofocus]
			// 3. Tabbable element inside the content element
			// 4. Tabbable element inside the buttonpane
			// 5. The close button
			// 6. The dialog itself
			var hasFocus = this._focusedElement;
			if ( !hasFocus ) {
				hasFocus = this.element.find( "[autofocus]" );
			}
			if ( !hasFocus.length ) {
				hasFocus = this.element.find( ":tabbable" );
			}
			if ( !hasFocus.length ) {
				hasFocus = this.uiDialogButtonPane.find( ":tabbable" );
			}
			if ( !hasFocus.length ) {
				hasFocus = this.uiDialogTitlebarClose.filter( ":tabbable" );
			}
			if ( !hasFocus.length ) {
				hasFocus = this.uiDialog;
			}
			hasFocus.eq( 0 ).trigger( "focus" );
		},

		_restoreTabbableFocus: function() {
			var activeElement = $.ui.safeActiveElement( this.document[ 0 ] ),
				isActive = this.uiDialog[ 0 ] === activeElement ||
					$.contains( this.uiDialog[ 0 ], activeElement );
			if ( !isActive ) {
				this._focusTabbable();
			}
		},

		_keepFocus: function( event ) {
			event.preventDefault();
			this._restoreTabbableFocus();

			// support: IE
			// IE <= 8 doesn't prevent moving focus even with event.preventDefault()
			// so we check again later
			this._delay( this._restoreTabbableFocus );
		},

		_createWrapper: function() {
			this.uiDialog = $( "<div>" )
			.hide()
			.attr( {

				// Setting tabIndex makes the div focusable
				tabIndex: -1,
				role: "dialog"
			} )
			.appendTo( this._appendTo() );

			this._addClass( this.uiDialog, "ui-dialog", "ui-widget ui-widget-content ui-front" );
			this._on( this.uiDialog, {
				keydown: function( event ) {
					if ( this.options.closeOnEscape && !event.isDefaultPrevented() && event.keyCode &&
						event.keyCode === $.ui.keyCode.ESCAPE ) {
						event.preventDefault();
						this.close( event );
						return;
					}

					// Prevent tabbing out of dialogs
					if ( event.keyCode !== $.ui.keyCode.TAB || event.isDefaultPrevented() ) {
						return;
					}
					var tabbables = this.uiDialog.find( ":tabbable" ),
						first = tabbables.first(),
						last = tabbables.last();

					if ( ( event.target === last[ 0 ] || event.target === this.uiDialog[ 0 ] ) &&
						!event.shiftKey ) {
						this._delay( function() {
							first.trigger( "focus" );
						} );
						event.preventDefault();
					} else if ( ( event.target === first[ 0 ] ||
						event.target === this.uiDialog[ 0 ] ) && event.shiftKey ) {
						this._delay( function() {
							last.trigger( "focus" );
						} );
						event.preventDefault();
					}
				},
				mousedown: function( event ) {
					if ( this._moveToTop( event ) ) {
						this._focusTabbable();
					}
				}
			} );

			// We assume that any existing aria-describedby attribute means
			// that the dialog content is marked up properly
			// otherwise we brute force the content as the description
			if ( !this.element.find( "[aria-describedby]" ).length ) {
				this.uiDialog.attr( {
					"aria-describedby": this.element.uniqueId().attr( "id" )
				} );
			}
		},

		_createTitlebar: function() {
			var uiDialogTitle;

			this.uiDialogTitlebar = $( "<div>" );
			this._addClass( this.uiDialogTitlebar,
				"ui-dialog-titlebar", "ui-widget-header ui-helper-clearfix" );
			this._on( this.uiDialogTitlebar, {
				mousedown: function( event ) {

					// Don't prevent click on close button (#8838)
					// Focusing a dialog that is partially scrolled out of view
					// causes the browser to scroll it into view, preventing the click event
					if ( !$( event.target ).closest( ".ui-dialog-titlebar-close" ) ) {

						// Dialog isn't getting focus when dragging (#8063)
						this.uiDialog.trigger( "focus" );
					}
				}
			} );

			// Support: IE
			// Use type="button" to prevent enter keypresses in textboxes from closing the
			// dialog in IE (#9312)
			this.uiDialogTitlebarClose = $( "<button type='button'></button>" )
			.button( {
				label: $( "<a>" ).text( this.options.closeText ).html(),
				icon: "ui-icon-closethick",
				showLabel: false
			} )
			.appendTo( this.uiDialogTitlebar );

			this._addClass( this.uiDialogTitlebarClose, "ui-dialog-titlebar-close" );
			this._on( this.uiDialogTitlebarClose, {
				click: function( event ) {
					event.preventDefault();
					this.close( event );
				}
			} );

			uiDialogTitle = $( "<span>" ).uniqueId().prependTo( this.uiDialogTitlebar );
			this._addClass( uiDialogTitle, "ui-dialog-title" );
			this._title( uiDialogTitle );

			this.uiDialogTitlebar.prependTo( this.uiDialog );

			this.uiDialog.attr( {
				"aria-labelledby": uiDialogTitle.attr( "id" )
			} );
		},

		_title: function( title ) {
			if ( this.options.title ) {
				title.text( this.options.title );
			} else {
				title.html( "&#160;" );
			}
		},

		_createButtonPane: function() {
			this.uiDialogButtonPane = $( "<div>" );
			this._addClass( this.uiDialogButtonPane, "ui-dialog-buttonpane",
				"ui-widget-content ui-helper-clearfix" );

			this.uiButtonSet = $( "<div>" )
			.appendTo( this.uiDialogButtonPane );
			this._addClass( this.uiButtonSet, "ui-dialog-buttonset" );

			this._createButtons();
		},

		_createButtons: function() {
			var that = this,
				buttons = this.options.buttons;

			// If we already have a button pane, remove it
			this.uiDialogButtonPane.remove();
			this.uiButtonSet.empty();

			if ( $.isEmptyObject( buttons ) || ( Array.isArray( buttons ) && !buttons.length ) ) {
				this._removeClass( this.uiDialog, "ui-dialog-buttons" );
				return;
			}

			$.each( buttons, function( name, props ) {
				var click, buttonOptions;
				props = typeof props === "function" ?
					{ click: props, text: name } :
					props;

				// Default to a non-submitting button
				props = $.extend( { type: "button" }, props );

				// Change the context for the click callback to be the main element
				click = props.click;
				buttonOptions = {
					icon: props.icon,
					iconPosition: props.iconPosition,
					showLabel: props.showLabel,

					// Deprecated options
					icons: props.icons,
					text: props.text
				};

				delete props.click;
				delete props.icon;
				delete props.iconPosition;
				delete props.showLabel;

				// Deprecated options
				delete props.icons;
				if ( typeof props.text === "boolean" ) {
					delete props.text;
				}

				$( "<button></button>", props )
				.button( buttonOptions )
				.appendTo( that.uiButtonSet )
				.on( "click", function() {
					click.apply( that.element[ 0 ], arguments );
				} );
			} );
			this._addClass( this.uiDialog, "ui-dialog-buttons" );
			this.uiDialogButtonPane.appendTo( this.uiDialog );
		},

		_makeDraggable: function() {
			var that = this,
				options = this.options;

			function filteredUi( ui ) {
				return {
					position: ui.position,
					offset: ui.offset
				};
			}

			this.uiDialog.draggable( {
				cancel: ".ui-dialog-content, .ui-dialog-titlebar-close",
				handle: ".ui-dialog-titlebar",
				containment: "document",
				start: function( event, ui ) {
					that._addClass( $( this ), "ui-dialog-dragging" );
					that._blockFrames();
					that._trigger( "dragStart", event, filteredUi( ui ) );
				},
				drag: function( event, ui ) {
					that._trigger( "drag", event, filteredUi( ui ) );
				},
				stop: function( event, ui ) {
					var left = ui.offset.left - that.document.scrollLeft(),
						top = ui.offset.top - that.document.scrollTop();

					options.position = {
						my: "left top",
						at: "left" + ( left >= 0 ? "+" : "" ) + left + " " +
							"top" + ( top >= 0 ? "+" : "" ) + top,
						of: that.window
					};
					that._removeClass( $( this ), "ui-dialog-dragging" );
					that._unblockFrames();
					that._trigger( "dragStop", event, filteredUi( ui ) );
				}
			} );
		},

		_makeResizable: function() {
			var that = this,
				options = this.options,
				handles = options.resizable,

				// .ui-resizable has position: relative defined in the stylesheet
				// but dialogs have to use absolute or fixed positioning
				position = this.uiDialog.css( "position" ),
				resizeHandles = typeof handles === "string" ?
					handles :
					"n,e,s,w,se,sw,ne,nw";

			function filteredUi( ui ) {
				return {
					originalPosition: ui.originalPosition,
					originalSize: ui.originalSize,
					position: ui.position,
					size: ui.size
				};
			}

			this.uiDialog.resizable( {
				cancel: ".ui-dialog-content",
				containment: "document",
				alsoResize: this.element,
				maxWidth: options.maxWidth,
				maxHeight: options.maxHeight,
				minWidth: options.minWidth,
				minHeight: this._minHeight(),
				handles: resizeHandles,
				start: function( event, ui ) {
					that._addClass( $( this ), "ui-dialog-resizing" );
					that._blockFrames();
					that._trigger( "resizeStart", event, filteredUi( ui ) );
				},
				resize: function( event, ui ) {
					that._trigger( "resize", event, filteredUi( ui ) );
				},
				stop: function( event, ui ) {
					var offset = that.uiDialog.offset(),
						left = offset.left - that.document.scrollLeft(),
						top = offset.top - that.document.scrollTop();

					options.height = that.uiDialog.height();
					options.width = that.uiDialog.width();
					options.position = {
						my: "left top",
						at: "left" + ( left >= 0 ? "+" : "" ) + left + " " +
							"top" + ( top >= 0 ? "+" : "" ) + top,
						of: that.window
					};
					that._removeClass( $( this ), "ui-dialog-resizing" );
					that._unblockFrames();
					that._trigger( "resizeStop", event, filteredUi( ui ) );
				}
			} )
			.css( "position", position );
		},

		_trackFocus: function() {
			this._on( this.widget(), {
				focusin: function( event ) {
					this._makeFocusTarget();
					this._focusedElement = $( event.target );
				}
			} );
		},

		_makeFocusTarget: function() {
			this._untrackInstance();
			this._trackingInstances().unshift( this );
		},

		_untrackInstance: function() {
			var instances = this._trackingInstances(),
				exists = $.inArray( this, instances );
			if ( exists !== -1 ) {
				instances.splice( exists, 1 );
			}
		},

		_trackingInstances: function() {
			var instances = this.document.data( "ui-dialog-instances" );
			if ( !instances ) {
				instances = [];
				this.document.data( "ui-dialog-instances", instances );
			}
			return instances;
		},

		_minHeight: function() {
			var options = this.options;

			return options.height === "auto" ?
				options.minHeight :
				Math.min( options.minHeight, options.height );
		},

		_position: function() {

			// Need to show the dialog to get the actual offset in the position plugin
			var isVisible = this.uiDialog.is( ":visible" );
			if ( !isVisible ) {
				this.uiDialog.show();
			}
			this.uiDialog.position( this.options.position );
			if ( !isVisible ) {
				this.uiDialog.hide();
			}
		},

		_setOptions: function( options ) {
			var that = this,
				resize = false,
				resizableOptions = {};

			$.each( options, function( key, value ) {
				that._setOption( key, value );

				if ( key in that.sizeRelatedOptions ) {
					resize = true;
				}
				if ( key in that.resizableRelatedOptions ) {
					resizableOptions[ key ] = value;
				}
			} );

			if ( resize ) {
				this._size();
				this._position();
			}
			if ( this.uiDialog.is( ":data(ui-resizable)" ) ) {
				this.uiDialog.resizable( "option", resizableOptions );
			}
		},

		_setOption: function( key, value ) {
			var isDraggable, isResizable,
				uiDialog = this.uiDialog;

			if ( key === "disabled" ) {
				return;
			}

			this._super( key, value );

			if ( key === "appendTo" ) {
				this.uiDialog.appendTo( this._appendTo() );
			}

			if ( key === "buttons" ) {
				this._createButtons();
			}

			if ( key === "closeText" ) {
				this.uiDialogTitlebarClose.button( {

					// Ensure that we always pass a string
					label: $( "<a>" ).text( "" + this.options.closeText ).html()
				} );
			}

			if ( key === "draggable" ) {
				isDraggable = uiDialog.is( ":data(ui-draggable)" );
				if ( isDraggable && !value ) {
					uiDialog.draggable( "destroy" );
				}

				if ( !isDraggable && value ) {
					this._makeDraggable();
				}
			}

			if ( key === "position" ) {
				this._position();
			}

			if ( key === "resizable" ) {

				// currently resizable, becoming non-resizable
				isResizable = uiDialog.is( ":data(ui-resizable)" );
				if ( isResizable && !value ) {
					uiDialog.resizable( "destroy" );
				}

				// Currently resizable, changing handles
				if ( isResizable && typeof value === "string" ) {
					uiDialog.resizable( "option", "handles", value );
				}

				// Currently non-resizable, becoming resizable
				if ( !isResizable && value !== false ) {
					this._makeResizable();
				}
			}

			if ( key === "title" ) {
				this._title( this.uiDialogTitlebar.find( ".ui-dialog-title" ) );
			}
		},

		_size: function() {

			// If the user has resized the dialog, the .ui-dialog and .ui-dialog-content
			// divs will both have width and height set, so we need to reset them
			var nonContentHeight, minContentHeight, maxContentHeight,
				options = this.options;

			// Reset content sizing
			this.element.show().css( {
				width: "auto",
				minHeight: 0,
				maxHeight: "none",
				height: 0
			} );

			if ( options.minWidth > options.width ) {
				options.width = options.minWidth;
			}

			// Reset wrapper sizing
			// determine the height of all the non-content elements
			nonContentHeight = this.uiDialog.css( {
				height: "auto",
				width: options.width
			} )
			.outerHeight();
			minContentHeight = Math.max( 0, options.minHeight - nonContentHeight );
			maxContentHeight = typeof options.maxHeight === "number" ?
				Math.max( 0, options.maxHeight - nonContentHeight ) :
				"none";

			if ( options.height === "auto" ) {
				this.element.css( {
					minHeight: minContentHeight,
					maxHeight: maxContentHeight,
					height: "auto"
				} );
			} else {
				this.element.height( Math.max( 0, options.height - nonContentHeight ) );
			}

			if ( this.uiDialog.is( ":data(ui-resizable)" ) ) {
				this.uiDialog.resizable( "option", "minHeight", this._minHeight() );
			}
		},

		_blockFrames: function() {
			this.iframeBlocks = this.document.find( "iframe" ).map( function() {
				var iframe = $( this );

				return $( "<div>" )
				.css( {
					position: "absolute",
					width: iframe.outerWidth(),
					height: iframe.outerHeight()
				} )
				.appendTo( iframe.parent() )
				.offset( iframe.offset() )[ 0 ];
			} );
		},

		_unblockFrames: function() {
			if ( this.iframeBlocks ) {
				this.iframeBlocks.remove();
				delete this.iframeBlocks;
			}
		},

		_allowInteraction: function( event ) {
			if ( $( event.target ).closest( ".ui-dialog" ).length ) {
				return true;
			}

			// TODO: Remove hack when datepicker implements
			// the .ui-front logic (#8989)
			return !!$( event.target ).closest( ".ui-datepicker" ).length;
		},

		_createOverlay: function() {
			if ( !this.options.modal ) {
				return;
			}

			var jqMinor = $.fn.jquery.substring( 0, 4 );

			// We use a delay in case the overlay is created from an
			// event that we're going to be cancelling (#2804)
			var isOpening = true;
			this._delay( function() {
				isOpening = false;
			} );

			if ( !this.document.data( "ui-dialog-overlays" ) ) {

				// Prevent use of anchors and inputs
				// This doesn't use `_on()` because it is a shared event handler
				// across all open modal dialogs.
				this.document.on( "focusin.ui-dialog", function( event ) {
					if ( isOpening ) {
						return;
					}

					var instance = this._trackingInstances()[ 0 ];
					if ( !instance._allowInteraction( event ) ) {
						event.preventDefault();
						instance._focusTabbable();

						// Support: jQuery >=3.4 <3.6 only
						// Focus re-triggering in jQuery 3.4/3.5 makes the original element
						// have its focus event propagated last, breaking the re-targeting.
						// Trigger focus in a delay in addition if needed to avoid the issue
						// See https://github.com/jquery/jquery/issues/4382
						if ( jqMinor === "3.4." || jqMinor === "3.5." ) {
							instance._delay( instance._restoreTabbableFocus );
						}
					}
				}.bind( this ) );
			}

			this.overlay = $( "<div>" )
			.appendTo( this._appendTo() );

			this._addClass( this.overlay, null, "ui-widget-overlay ui-front" );
			this._on( this.overlay, {
				mousedown: "_keepFocus"
			} );
			this.document.data( "ui-dialog-overlays",
				( this.document.data( "ui-dialog-overlays" ) || 0 ) + 1 );
		},

		_destroyOverlay: function() {
			if ( !this.options.modal ) {
				return;
			}

			if ( this.overlay ) {
				var overlays = this.document.data( "ui-dialog-overlays" ) - 1;

				if ( !overlays ) {
					this.document.off( "focusin.ui-dialog" );
					this.document.removeData( "ui-dialog-overlays" );
				} else {
					this.document.data( "ui-dialog-overlays", overlays );
				}

				this.overlay.remove();
				this.overlay = null;
			}
		}
	} );

// DEPRECATED
// TODO: switch return back to widget declaration at top of file when this is removed
	if ( $.uiBackCompat !== false ) {

		// Backcompat for dialogClass option
		$.widget( "ui.dialog", $.ui.dialog, {
			options: {
				dialogClass: ""
			},
			_createWrapper: function() {
				this._super();
				this.uiDialog.addClass( this.options.dialogClass );
			},
			_setOption: function( key, value ) {
				if ( key === "dialogClass" ) {
					this.uiDialog
					.removeClass( this.options.dialogClass )
					.addClass( value );
				}
				this._superApply( arguments );
			}
		} );
	}

	var widgetsDialog = $.ui.dialog;


	/*!
 * jQuery UI Droppable 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Droppable
//>>group: Interactions
//>>description: Enables drop targets for draggable elements.
//>>docs: http://api.jqueryui.com/droppable/
//>>demos: http://jqueryui.com/droppable/


	$.widget( "ui.droppable", {
		version: "1.13.0",
		widgetEventPrefix: "drop",
		options: {
			accept: "*",
			addClasses: true,
			greedy: false,
			scope: "default",
			tolerance: "intersect",

			// Callbacks
			activate: null,
			deactivate: null,
			drop: null,
			out: null,
			over: null
		},
		_create: function() {

			var proportions,
				o = this.options,
				accept = o.accept;

			this.isover = false;
			this.isout = true;

			this.accept = typeof accept === "function" ? accept : function( d ) {
				return d.is( accept );
			};

			this.proportions = function( /* valueToWrite */ ) {
				if ( arguments.length ) {

					// Store the droppable's proportions
					proportions = arguments[ 0 ];
				} else {

					// Retrieve or derive the droppable's proportions
					return proportions ?
						proportions :
						proportions = {
							width: this.element[ 0 ].offsetWidth,
							height: this.element[ 0 ].offsetHeight
						};
				}
			};

			this._addToManager( o.scope );

			if ( o.addClasses ) {
				this._addClass( "ui-droppable" );
			}

		},

		_addToManager: function( scope ) {

			// Add the reference and positions to the manager
			$.ui.ddmanager.droppables[ scope ] = $.ui.ddmanager.droppables[ scope ] || [];
			$.ui.ddmanager.droppables[ scope ].push( this );
		},

		_splice: function( drop ) {
			var i = 0;
			for ( ; i < drop.length; i++ ) {
				if ( drop[ i ] === this ) {
					drop.splice( i, 1 );
				}
			}
		},

		_destroy: function() {
			var drop = $.ui.ddmanager.droppables[ this.options.scope ];

			this._splice( drop );
		},

		_setOption: function( key, value ) {

			if ( key === "accept" ) {
				this.accept = typeof value === "function" ? value : function( d ) {
					return d.is( value );
				};
			} else if ( key === "scope" ) {
				var drop = $.ui.ddmanager.droppables[ this.options.scope ];

				this._splice( drop );
				this._addToManager( value );
			}

			this._super( key, value );
		},

		_activate: function( event ) {
			var draggable = $.ui.ddmanager.current;

			this._addActiveClass();
			if ( draggable ) {
				this._trigger( "activate", event, this.ui( draggable ) );
			}
		},

		_deactivate: function( event ) {
			var draggable = $.ui.ddmanager.current;

			this._removeActiveClass();
			if ( draggable ) {
				this._trigger( "deactivate", event, this.ui( draggable ) );
			}
		},

		_over: function( event ) {

			var draggable = $.ui.ddmanager.current;

			// Bail if draggable and droppable are same element
			if ( !draggable || ( draggable.currentItem ||
				draggable.element )[ 0 ] === this.element[ 0 ] ) {
				return;
			}

			if ( this.accept.call( this.element[ 0 ], ( draggable.currentItem ||
				draggable.element ) ) ) {
				this._addHoverClass();
				this._trigger( "over", event, this.ui( draggable ) );
			}

		},

		_out: function( event ) {

			var draggable = $.ui.ddmanager.current;

			// Bail if draggable and droppable are same element
			if ( !draggable || ( draggable.currentItem ||
				draggable.element )[ 0 ] === this.element[ 0 ] ) {
				return;
			}

			if ( this.accept.call( this.element[ 0 ], ( draggable.currentItem ||
				draggable.element ) ) ) {
				this._removeHoverClass();
				this._trigger( "out", event, this.ui( draggable ) );
			}

		},

		_drop: function( event, custom ) {

			var draggable = custom || $.ui.ddmanager.current,
				childrenIntersection = false;

			// Bail if draggable and droppable are same element
			if ( !draggable || ( draggable.currentItem ||
				draggable.element )[ 0 ] === this.element[ 0 ] ) {
				return false;
			}

			this.element
			.find( ":data(ui-droppable)" )
			.not( ".ui-draggable-dragging" )
			.each( function() {
				var inst = $( this ).droppable( "instance" );
				if (
					inst.options.greedy &&
					!inst.options.disabled &&
					inst.options.scope === draggable.options.scope &&
					inst.accept.call(
						inst.element[ 0 ], ( draggable.currentItem || draggable.element )
					) &&
					$.ui.intersect(
						draggable,
						$.extend( inst, { offset: inst.element.offset() } ),
						inst.options.tolerance, event
					)
				) {
					childrenIntersection = true;
					return false;
				}
			} );
			if ( childrenIntersection ) {
				return false;
			}

			if ( this.accept.call( this.element[ 0 ],
				( draggable.currentItem || draggable.element ) ) ) {
				this._removeActiveClass();
				this._removeHoverClass();

				this._trigger( "drop", event, this.ui( draggable ) );
				return this.element;
			}

			return false;

		},

		ui: function( c ) {
			return {
				draggable: ( c.currentItem || c.element ),
				helper: c.helper,
				position: c.position,
				offset: c.positionAbs
			};
		},

		// Extension points just to make backcompat sane and avoid duplicating logic
		// TODO: Remove in 1.14 along with call to it below
		_addHoverClass: function() {
			this._addClass( "ui-droppable-hover" );
		},

		_removeHoverClass: function() {
			this._removeClass( "ui-droppable-hover" );
		},

		_addActiveClass: function() {
			this._addClass( "ui-droppable-active" );
		},

		_removeActiveClass: function() {
			this._removeClass( "ui-droppable-active" );
		}
	} );

	$.ui.intersect = ( function() {
		function isOverAxis( x, reference, size ) {
			return ( x >= reference ) && ( x < ( reference + size ) );
		}

		return function( draggable, droppable, toleranceMode, event ) {

			if ( !droppable.offset ) {
				return false;
			}

			var x1 = ( draggable.positionAbs ||
					draggable.position.absolute ).left + draggable.margins.left,
				y1 = ( draggable.positionAbs ||
					draggable.position.absolute ).top + draggable.margins.top,
				x2 = x1 + draggable.helperProportions.width,
				y2 = y1 + draggable.helperProportions.height,
				l = droppable.offset.left,
				t = droppable.offset.top,
				r = l + droppable.proportions().width,
				b = t + droppable.proportions().height;

			switch ( toleranceMode ) {
				case "fit":
					return ( l <= x1 && x2 <= r && t <= y1 && y2 <= b );
				case "intersect":
					return ( l < x1 + ( draggable.helperProportions.width / 2 ) && // Right Half
						x2 - ( draggable.helperProportions.width / 2 ) < r && // Left Half
						t < y1 + ( draggable.helperProportions.height / 2 ) && // Bottom Half
						y2 - ( draggable.helperProportions.height / 2 ) < b ); // Top Half
				case "pointer":
					return isOverAxis( event.pageY, t, droppable.proportions().height ) &&
						isOverAxis( event.pageX, l, droppable.proportions().width );
				case "touch":
					return (
						( y1 >= t && y1 <= b ) || // Top edge touching
						( y2 >= t && y2 <= b ) || // Bottom edge touching
						( y1 < t && y2 > b ) // Surrounded vertically
					) && (
						( x1 >= l && x1 <= r ) || // Left edge touching
						( x2 >= l && x2 <= r ) || // Right edge touching
						( x1 < l && x2 > r ) // Surrounded horizontally
					);
				default:
					return false;
			}
		};
	} )();

	/*
	This manager tracks offsets of draggables and droppables
*/
	$.ui.ddmanager = {
		current: null,
		droppables: { "default": [] },
		prepareOffsets: function( t, event ) {

			var i, j,
				m = $.ui.ddmanager.droppables[ t.options.scope ] || [],
				type = event ? event.type : null, // workaround for #2317
				list = ( t.currentItem || t.element ).find( ":data(ui-droppable)" ).addBack();

			droppablesLoop: for ( i = 0; i < m.length; i++ ) {

				// No disabled and non-accepted
				if ( m[ i ].options.disabled || ( t && !m[ i ].accept.call( m[ i ].element[ 0 ],
					( t.currentItem || t.element ) ) ) ) {
					continue;
				}

				// Filter out elements in the current dragged item
				for ( j = 0; j < list.length; j++ ) {
					if ( list[ j ] === m[ i ].element[ 0 ] ) {
						m[ i ].proportions().height = 0;
						continue droppablesLoop;
					}
				}

				m[ i ].visible = m[ i ].element.css( "display" ) !== "none";
				if ( !m[ i ].visible ) {
					continue;
				}

				// Activate the droppable if used directly from draggables
				if ( type === "mousedown" ) {
					m[ i ]._activate.call( m[ i ], event );
				}

				m[ i ].offset = m[ i ].element.offset();
				m[ i ].proportions( {
					width: m[ i ].element[ 0 ].offsetWidth,
					height: m[ i ].element[ 0 ].offsetHeight
				} );

			}

		},
		drop: function( draggable, event ) {

			var dropped = false;

			// Create a copy of the droppables in case the list changes during the drop (#9116)
			$.each( ( $.ui.ddmanager.droppables[ draggable.options.scope ] || [] ).slice(), function() {

				if ( !this.options ) {
					return;
				}
				if ( !this.options.disabled && this.visible &&
					$.ui.intersect( draggable, this, this.options.tolerance, event ) ) {
					dropped = this._drop.call( this, event ) || dropped;
				}

				if ( !this.options.disabled && this.visible && this.accept.call( this.element[ 0 ],
					( draggable.currentItem || draggable.element ) ) ) {
					this.isout = true;
					this.isover = false;
					this._deactivate.call( this, event );
				}

			} );
			return dropped;

		},
		dragStart: function( draggable, event ) {

			// Listen for scrolling so that if the dragging causes scrolling the position of the
			// droppables can be recalculated (see #5003)
			draggable.element.parentsUntil( "body" ).on( "scroll.droppable", function() {
				if ( !draggable.options.refreshPositions ) {
					$.ui.ddmanager.prepareOffsets( draggable, event );
				}
			} );
		},
		drag: function( draggable, event ) {

			// If you have a highly dynamic page, you might try this option. It renders positions
			// every time you move the mouse.
			if ( draggable.options.refreshPositions ) {
				$.ui.ddmanager.prepareOffsets( draggable, event );
			}

			// Run through all droppables and check their positions based on specific tolerance options
			$.each( $.ui.ddmanager.droppables[ draggable.options.scope ] || [], function() {

				if ( this.options.disabled || this.greedyChild || !this.visible ) {
					return;
				}

				var parentInstance, scope, parent,
					intersects = $.ui.intersect( draggable, this, this.options.tolerance, event ),
					c = !intersects && this.isover ?
						"isout" :
						( intersects && !this.isover ? "isover" : null );
				if ( !c ) {
					return;
				}

				if ( this.options.greedy ) {

					// find droppable parents with same scope
					scope = this.options.scope;
					parent = this.element.parents( ":data(ui-droppable)" ).filter( function() {
						return $( this ).droppable( "instance" ).options.scope === scope;
					} );

					if ( parent.length ) {
						parentInstance = $( parent[ 0 ] ).droppable( "instance" );
						parentInstance.greedyChild = ( c === "isover" );
					}
				}

				// We just moved into a greedy child
				if ( parentInstance && c === "isover" ) {
					parentInstance.isover = false;
					parentInstance.isout = true;
					parentInstance._out.call( parentInstance, event );
				}

				this[ c ] = true;
				this[ c === "isout" ? "isover" : "isout" ] = false;
				this[ c === "isover" ? "_over" : "_out" ].call( this, event );

				// We just moved out of a greedy child
				if ( parentInstance && c === "isout" ) {
					parentInstance.isout = false;
					parentInstance.isover = true;
					parentInstance._over.call( parentInstance, event );
				}
			} );

		},
		dragStop: function( draggable, event ) {
			draggable.element.parentsUntil( "body" ).off( "scroll.droppable" );

			// Call prepareOffsets one final time since IE does not fire return scroll events when
			// overflow was caused by drag (see #5003)
			if ( !draggable.options.refreshPositions ) {
				$.ui.ddmanager.prepareOffsets( draggable, event );
			}
		}
	};

// DEPRECATED
// TODO: switch return back to widget declaration at top of file when this is removed
	if ( $.uiBackCompat !== false ) {

		// Backcompat for activeClass and hoverClass options
		$.widget( "ui.droppable", $.ui.droppable, {
			options: {
				hoverClass: false,
				activeClass: false
			},
			_addActiveClass: function() {
				this._super();
				if ( this.options.activeClass ) {
					this.element.addClass( this.options.activeClass );
				}
			},
			_removeActiveClass: function() {
				this._super();
				if ( this.options.activeClass ) {
					this.element.removeClass( this.options.activeClass );
				}
			},
			_addHoverClass: function() {
				this._super();
				if ( this.options.hoverClass ) {
					this.element.addClass( this.options.hoverClass );
				}
			},
			_removeHoverClass: function() {
				this._super();
				if ( this.options.hoverClass ) {
					this.element.removeClass( this.options.hoverClass );
				}
			}
		} );
	}

	var widgetsDroppable = $.ui.droppable;


	/*!
 * jQuery UI Progressbar 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Progressbar
//>>group: Widgets
	/* eslint-disable max-len */
//>>description: Displays a status indicator for loading state, standard percentage, and other progress indicators.
	/* eslint-enable max-len */
//>>docs: http://api.jqueryui.com/progressbar/
//>>demos: http://jqueryui.com/progressbar/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/progressbar.css
//>>css.theme: ../../themes/base/theme.css


	var widgetsProgressbar = $.widget( "ui.progressbar", {
		version: "1.13.0",
		options: {
			classes: {
				"ui-progressbar": "ui-corner-all",
				"ui-progressbar-value": "ui-corner-left",
				"ui-progressbar-complete": "ui-corner-right"
			},
			max: 100,
			value: 0,

			change: null,
			complete: null
		},

		min: 0,

		_create: function() {

			// Constrain initial value
			this.oldValue = this.options.value = this._constrainedValue();

			this.element.attr( {

				// Only set static values; aria-valuenow and aria-valuemax are
				// set inside _refreshValue()
				role: "progressbar",
				"aria-valuemin": this.min
			} );
			this._addClass( "ui-progressbar", "ui-widget ui-widget-content" );

			this.valueDiv = $( "<div>" ).appendTo( this.element );
			this._addClass( this.valueDiv, "ui-progressbar-value", "ui-widget-header" );
			this._refreshValue();
		},

		_destroy: function() {
			this.element.removeAttr( "role aria-valuemin aria-valuemax aria-valuenow" );

			this.valueDiv.remove();
		},

		value: function( newValue ) {
			if ( newValue === undefined ) {
				return this.options.value;
			}

			this.options.value = this._constrainedValue( newValue );
			this._refreshValue();
		},

		_constrainedValue: function( newValue ) {
			if ( newValue === undefined ) {
				newValue = this.options.value;
			}

			this.indeterminate = newValue === false;

			// Sanitize value
			if ( typeof newValue !== "number" ) {
				newValue = 0;
			}

			return this.indeterminate ? false :
				Math.min( this.options.max, Math.max( this.min, newValue ) );
		},

		_setOptions: function( options ) {

			// Ensure "value" option is set after other values (like max)
			var value = options.value;
			delete options.value;

			this._super( options );

			this.options.value = this._constrainedValue( value );
			this._refreshValue();
		},

		_setOption: function( key, value ) {
			if ( key === "max" ) {

				// Don't allow a max less than min
				value = Math.max( this.min, value );
			}
			this._super( key, value );
		},

		_setOptionDisabled: function( value ) {
			this._super( value );

			this.element.attr( "aria-disabled", value );
			this._toggleClass( null, "ui-state-disabled", !!value );
		},

		_percentage: function() {
			return this.indeterminate ?
				100 :
				100 * ( this.options.value - this.min ) / ( this.options.max - this.min );
		},

		_refreshValue: function() {
			var value = this.options.value,
				percentage = this._percentage();

			this.valueDiv
			.toggle( this.indeterminate || value > this.min )
			.width( percentage.toFixed( 0 ) + "%" );

			this
			._toggleClass( this.valueDiv, "ui-progressbar-complete", null,
				value === this.options.max )
			._toggleClass( "ui-progressbar-indeterminate", null, this.indeterminate );

			if ( this.indeterminate ) {
				this.element.removeAttr( "aria-valuenow" );
				if ( !this.overlayDiv ) {
					this.overlayDiv = $( "<div>" ).appendTo( this.valueDiv );
					this._addClass( this.overlayDiv, "ui-progressbar-overlay" );
				}
			} else {
				this.element.attr( {
					"aria-valuemax": this.options.max,
					"aria-valuenow": value
				} );
				if ( this.overlayDiv ) {
					this.overlayDiv.remove();
					this.overlayDiv = null;
				}
			}

			if ( this.oldValue !== value ) {
				this.oldValue = value;
				this._trigger( "change" );
			}
			if ( value === this.options.max ) {
				this._trigger( "complete" );
			}
		}
	} );


	/*!
 * jQuery UI Selectable 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Selectable
//>>group: Interactions
//>>description: Allows groups of elements to be selected with the mouse.
//>>docs: http://api.jqueryui.com/selectable/
//>>demos: http://jqueryui.com/selectable/
//>>css.structure: ../../themes/base/selectable.css


	var widgetsSelectable = $.widget( "ui.selectable", $.ui.mouse, {
		version: "1.13.0",
		options: {
			appendTo: "body",
			autoRefresh: true,
			distance: 0,
			filter: "*",
			tolerance: "touch",

			// Callbacks
			selected: null,
			selecting: null,
			start: null,
			stop: null,
			unselected: null,
			unselecting: null
		},
		_create: function() {
			var that = this;

			this._addClass( "ui-selectable" );

			this.dragged = false;

			// Cache selectee children based on filter
			this.refresh = function() {
				that.elementPos = $( that.element[ 0 ] ).offset();
				that.selectees = $( that.options.filter, that.element[ 0 ] );
				that._addClass( that.selectees, "ui-selectee" );
				that.selectees.each( function() {
					var $this = $( this ),
						selecteeOffset = $this.offset(),
						pos = {
							left: selecteeOffset.left - that.elementPos.left,
							top: selecteeOffset.top - that.elementPos.top
						};
					$.data( this, "selectable-item", {
						element: this,
						$element: $this,
						left: pos.left,
						top: pos.top,
						right: pos.left + $this.outerWidth(),
						bottom: pos.top + $this.outerHeight(),
						startselected: false,
						selected: $this.hasClass( "ui-selected" ),
						selecting: $this.hasClass( "ui-selecting" ),
						unselecting: $this.hasClass( "ui-unselecting" )
					} );
				} );
			};
			this.refresh();

			this._mouseInit();

			this.helper = $( "<div>" );
			this._addClass( this.helper, "ui-selectable-helper" );
		},

		_destroy: function() {
			this.selectees.removeData( "selectable-item" );
			this._mouseDestroy();
		},

		_mouseStart: function( event ) {
			var that = this,
				options = this.options;

			this.opos = [ event.pageX, event.pageY ];
			this.elementPos = $( this.element[ 0 ] ).offset();

			if ( this.options.disabled ) {
				return;
			}

			this.selectees = $( options.filter, this.element[ 0 ] );

			this._trigger( "start", event );

			$( options.appendTo ).append( this.helper );

			// position helper (lasso)
			this.helper.css( {
				"left": event.pageX,
				"top": event.pageY,
				"width": 0,
				"height": 0
			} );

			if ( options.autoRefresh ) {
				this.refresh();
			}

			this.selectees.filter( ".ui-selected" ).each( function() {
				var selectee = $.data( this, "selectable-item" );
				selectee.startselected = true;
				if ( !event.metaKey && !event.ctrlKey ) {
					that._removeClass( selectee.$element, "ui-selected" );
					selectee.selected = false;
					that._addClass( selectee.$element, "ui-unselecting" );
					selectee.unselecting = true;

					// selectable UNSELECTING callback
					that._trigger( "unselecting", event, {
						unselecting: selectee.element
					} );
				}
			} );

			$( event.target ).parents().addBack().each( function() {
				var doSelect,
					selectee = $.data( this, "selectable-item" );
				if ( selectee ) {
					doSelect = ( !event.metaKey && !event.ctrlKey ) ||
						!selectee.$element.hasClass( "ui-selected" );
					that._removeClass( selectee.$element, doSelect ? "ui-unselecting" : "ui-selected" )
					._addClass( selectee.$element, doSelect ? "ui-selecting" : "ui-unselecting" );
					selectee.unselecting = !doSelect;
					selectee.selecting = doSelect;
					selectee.selected = doSelect;

					// selectable (UN)SELECTING callback
					if ( doSelect ) {
						that._trigger( "selecting", event, {
							selecting: selectee.element
						} );
					} else {
						that._trigger( "unselecting", event, {
							unselecting: selectee.element
						} );
					}
					return false;
				}
			} );

		},

		_mouseDrag: function( event ) {

			this.dragged = true;

			if ( this.options.disabled ) {
				return;
			}

			var tmp,
				that = this,
				options = this.options,
				x1 = this.opos[ 0 ],
				y1 = this.opos[ 1 ],
				x2 = event.pageX,
				y2 = event.pageY;

			if ( x1 > x2 ) {
				tmp = x2; x2 = x1; x1 = tmp;
			}
			if ( y1 > y2 ) {
				tmp = y2; y2 = y1; y1 = tmp;
			}
			this.helper.css( { left: x1, top: y1, width: x2 - x1, height: y2 - y1 } );

			this.selectees.each( function() {
				var selectee = $.data( this, "selectable-item" ),
					hit = false,
					offset = {};

				//prevent helper from being selected if appendTo: selectable
				if ( !selectee || selectee.element === that.element[ 0 ] ) {
					return;
				}

				offset.left   = selectee.left   + that.elementPos.left;
				offset.right  = selectee.right  + that.elementPos.left;
				offset.top    = selectee.top    + that.elementPos.top;
				offset.bottom = selectee.bottom + that.elementPos.top;

				if ( options.tolerance === "touch" ) {
					hit = ( !( offset.left > x2 || offset.right < x1 || offset.top > y2 ||
						offset.bottom < y1 ) );
				} else if ( options.tolerance === "fit" ) {
					hit = ( offset.left > x1 && offset.right < x2 && offset.top > y1 &&
						offset.bottom < y2 );
				}

				if ( hit ) {

					// SELECT
					if ( selectee.selected ) {
						that._removeClass( selectee.$element, "ui-selected" );
						selectee.selected = false;
					}
					if ( selectee.unselecting ) {
						that._removeClass( selectee.$element, "ui-unselecting" );
						selectee.unselecting = false;
					}
					if ( !selectee.selecting ) {
						that._addClass( selectee.$element, "ui-selecting" );
						selectee.selecting = true;

						// selectable SELECTING callback
						that._trigger( "selecting", event, {
							selecting: selectee.element
						} );
					}
				} else {

					// UNSELECT
					if ( selectee.selecting ) {
						if ( ( event.metaKey || event.ctrlKey ) && selectee.startselected ) {
							that._removeClass( selectee.$element, "ui-selecting" );
							selectee.selecting = false;
							that._addClass( selectee.$element, "ui-selected" );
							selectee.selected = true;
						} else {
							that._removeClass( selectee.$element, "ui-selecting" );
							selectee.selecting = false;
							if ( selectee.startselected ) {
								that._addClass( selectee.$element, "ui-unselecting" );
								selectee.unselecting = true;
							}

							// selectable UNSELECTING callback
							that._trigger( "unselecting", event, {
								unselecting: selectee.element
							} );
						}
					}
					if ( selectee.selected ) {
						if ( !event.metaKey && !event.ctrlKey && !selectee.startselected ) {
							that._removeClass( selectee.$element, "ui-selected" );
							selectee.selected = false;

							that._addClass( selectee.$element, "ui-unselecting" );
							selectee.unselecting = true;

							// selectable UNSELECTING callback
							that._trigger( "unselecting", event, {
								unselecting: selectee.element
							} );
						}
					}
				}
			} );

			return false;
		},

		_mouseStop: function( event ) {
			var that = this;

			this.dragged = false;

			$( ".ui-unselecting", this.element[ 0 ] ).each( function() {
				var selectee = $.data( this, "selectable-item" );
				that._removeClass( selectee.$element, "ui-unselecting" );
				selectee.unselecting = false;
				selectee.startselected = false;
				that._trigger( "unselected", event, {
					unselected: selectee.element
				} );
			} );
			$( ".ui-selecting", this.element[ 0 ] ).each( function() {
				var selectee = $.data( this, "selectable-item" );
				that._removeClass( selectee.$element, "ui-selecting" )
				._addClass( selectee.$element, "ui-selected" );
				selectee.selecting = false;
				selectee.selected = true;
				selectee.startselected = true;
				that._trigger( "selected", event, {
					selected: selectee.element
				} );
			} );
			this._trigger( "stop", event );

			this.helper.remove();

			return false;
		}

	} );


	/*!
 * jQuery UI Selectmenu 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Selectmenu
//>>group: Widgets
	/* eslint-disable max-len */
//>>description: Duplicates and extends the functionality of a native HTML select element, allowing it to be customizable in behavior and appearance far beyond the limitations of a native select.
	/* eslint-enable max-len */
//>>docs: http://api.jqueryui.com/selectmenu/
//>>demos: http://jqueryui.com/selectmenu/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/selectmenu.css, ../../themes/base/button.css
//>>css.theme: ../../themes/base/theme.css


	var widgetsSelectmenu = $.widget( "ui.selectmenu", [ $.ui.formResetMixin, {
		version: "1.13.0",
		defaultElement: "<select>",
		options: {
			appendTo: null,
			classes: {
				"ui-selectmenu-button-open": "ui-corner-top",
				"ui-selectmenu-button-closed": "ui-corner-all"
			},
			disabled: null,
			icons: {
				button: "ui-icon-triangle-1-s"
			},
			position: {
				my: "left top",
				at: "left bottom",
				collision: "none"
			},
			width: false,

			// Callbacks
			change: null,
			close: null,
			focus: null,
			open: null,
			select: null
		},

		_create: function() {
			var selectmenuId = this.element.uniqueId().attr( "id" );
			this.ids = {
				element: selectmenuId,
				button: selectmenuId + "-button",
				menu: selectmenuId + "-menu"
			};

			this._drawButton();
			this._drawMenu();
			this._bindFormResetHandler();

			this._rendered = false;
			this.menuItems = $();
		},

		_drawButton: function() {
			var icon,
				that = this,
				item = this._parseOption(
					this.element.find( "option:selected" ),
					this.element[ 0 ].selectedIndex
				);

			// Associate existing label with the new button
			this.labels = this.element.labels().attr( "for", this.ids.button );
			this._on( this.labels, {
				click: function( event ) {
					this.button.trigger( "focus" );
					event.preventDefault();
				}
			} );

			// Hide original select element
			this.element.hide();

			// Create button
			this.button = $( "<span>", {
				tabindex: this.options.disabled ? -1 : 0,
				id: this.ids.button,
				role: "combobox",
				"aria-expanded": "false",
				"aria-autocomplete": "list",
				"aria-owns": this.ids.menu,
				"aria-haspopup": "true",
				title: this.element.attr( "title" )
			} )
			.insertAfter( this.element );

			this._addClass( this.button, "ui-selectmenu-button ui-selectmenu-button-closed",
				"ui-button ui-widget" );

			icon = $( "<span>" ).appendTo( this.button );
			this._addClass( icon, "ui-selectmenu-icon", "ui-icon " + this.options.icons.button );
			this.buttonItem = this._renderButtonItem( item )
			.appendTo( this.button );

			if ( this.options.width !== false ) {
				this._resizeButton();
			}

			this._on( this.button, this._buttonEvents );
			this.button.one( "focusin", function() {

				// Delay rendering the menu items until the button receives focus.
				// The menu may have already been rendered via a programmatic open.
				if ( !that._rendered ) {
					that._refreshMenu();
				}
			} );
		},

		_drawMenu: function() {
			var that = this;

			// Create menu
			this.menu = $( "<ul>", {
				"aria-hidden": "true",
				"aria-labelledby": this.ids.button,
				id: this.ids.menu
			} );

			// Wrap menu
			this.menuWrap = $( "<div>" ).append( this.menu );
			this._addClass( this.menuWrap, "ui-selectmenu-menu", "ui-front" );
			this.menuWrap.appendTo( this._appendTo() );

			// Initialize menu widget
			this.menuInstance = this.menu
			.menu( {
				classes: {
					"ui-menu": "ui-corner-bottom"
				},
				role: "listbox",
				select: function( event, ui ) {
					event.preventDefault();

					// Support: IE8
					// If the item was selected via a click, the text selection
					// will be destroyed in IE
					that._setSelection();

					that._select( ui.item.data( "ui-selectmenu-item" ), event );
				},
				focus: function( event, ui ) {
					var item = ui.item.data( "ui-selectmenu-item" );

					// Prevent inital focus from firing and check if its a newly focused item
					if ( that.focusIndex != null && item.index !== that.focusIndex ) {
						that._trigger( "focus", event, { item: item } );
						if ( !that.isOpen ) {
							that._select( item, event );
						}
					}
					that.focusIndex = item.index;

					that.button.attr( "aria-activedescendant",
						that.menuItems.eq( item.index ).attr( "id" ) );
				}
			} )
			.menu( "instance" );

			// Don't close the menu on mouseleave
			this.menuInstance._off( this.menu, "mouseleave" );

			// Cancel the menu's collapseAll on document click
			this.menuInstance._closeOnDocumentClick = function() {
				return false;
			};

			// Selects often contain empty items, but never contain dividers
			this.menuInstance._isDivider = function() {
				return false;
			};
		},

		refresh: function() {
			this._refreshMenu();
			this.buttonItem.replaceWith(
				this.buttonItem = this._renderButtonItem(

					// Fall back to an empty object in case there are no options
					this._getSelectedItem().data( "ui-selectmenu-item" ) || {}
				)
			);
			if ( this.options.width === null ) {
				this._resizeButton();
			}
		},

		_refreshMenu: function() {
			var item,
				options = this.element.find( "option" );

			this.menu.empty();

			this._parseOptions( options );
			this._renderMenu( this.menu, this.items );

			this.menuInstance.refresh();
			this.menuItems = this.menu.find( "li" )
			.not( ".ui-selectmenu-optgroup" )
			.find( ".ui-menu-item-wrapper" );

			this._rendered = true;

			if ( !options.length ) {
				return;
			}

			item = this._getSelectedItem();

			// Update the menu to have the correct item focused
			this.menuInstance.focus( null, item );
			this._setAria( item.data( "ui-selectmenu-item" ) );

			// Set disabled state
			this._setOption( "disabled", this.element.prop( "disabled" ) );
		},

		open: function( event ) {
			if ( this.options.disabled ) {
				return;
			}

			// If this is the first time the menu is being opened, render the items
			if ( !this._rendered ) {
				this._refreshMenu();
			} else {

				// Menu clears focus on close, reset focus to selected item
				this._removeClass( this.menu.find( ".ui-state-active" ), null, "ui-state-active" );
				this.menuInstance.focus( null, this._getSelectedItem() );
			}

			// If there are no options, don't open the menu
			if ( !this.menuItems.length ) {
				return;
			}

			this.isOpen = true;
			this._toggleAttr();
			this._resizeMenu();
			this._position();

			this._on( this.document, this._documentClick );

			this._trigger( "open", event );
		},

		_position: function() {
			this.menuWrap.position( $.extend( { of: this.button }, this.options.position ) );
		},

		close: function( event ) {
			if ( !this.isOpen ) {
				return;
			}

			this.isOpen = false;
			this._toggleAttr();

			this.range = null;
			this._off( this.document );

			this._trigger( "close", event );
		},

		widget: function() {
			return this.button;
		},

		menuWidget: function() {
			return this.menu;
		},

		_renderButtonItem: function( item ) {
			var buttonItem = $( "<span>" );

			this._setText( buttonItem, item.label );
			this._addClass( buttonItem, "ui-selectmenu-text" );

			return buttonItem;
		},

		_renderMenu: function( ul, items ) {
			var that = this,
				currentOptgroup = "";

			$.each( items, function( index, item ) {
				var li;

				if ( item.optgroup !== currentOptgroup ) {
					li = $( "<li>", {
						text: item.optgroup
					} );
					that._addClass( li, "ui-selectmenu-optgroup", "ui-menu-divider" +
						( item.element.parent( "optgroup" ).prop( "disabled" ) ?
							" ui-state-disabled" :
							"" ) );

					li.appendTo( ul );

					currentOptgroup = item.optgroup;
				}

				that._renderItemData( ul, item );
			} );
		},

		_renderItemData: function( ul, item ) {
			return this._renderItem( ul, item ).data( "ui-selectmenu-item", item );
		},

		_renderItem: function( ul, item ) {
			var li = $( "<li>" ),
				wrapper = $( "<div>", {
					title: item.element.attr( "title" )
				} );

			if ( item.disabled ) {
				this._addClass( li, null, "ui-state-disabled" );
			}
			this._setText( wrapper, item.label );

			return li.append( wrapper ).appendTo( ul );
		},

		_setText: function( element, value ) {
			if ( value ) {
				element.text( value );
			} else {
				element.html( "&#160;" );
			}
		},

		_move: function( direction, event ) {
			var item, next,
				filter = ".ui-menu-item";

			if ( this.isOpen ) {
				item = this.menuItems.eq( this.focusIndex ).parent( "li" );
			} else {
				item = this.menuItems.eq( this.element[ 0 ].selectedIndex ).parent( "li" );
				filter += ":not(.ui-state-disabled)";
			}

			if ( direction === "first" || direction === "last" ) {
				next = item[ direction === "first" ? "prevAll" : "nextAll" ]( filter ).eq( -1 );
			} else {
				next = item[ direction + "All" ]( filter ).eq( 0 );
			}

			if ( next.length ) {
				this.menuInstance.focus( event, next );
			}
		},

		_getSelectedItem: function() {
			return this.menuItems.eq( this.element[ 0 ].selectedIndex ).parent( "li" );
		},

		_toggle: function( event ) {
			this[ this.isOpen ? "close" : "open" ]( event );
		},

		_setSelection: function() {
			var selection;

			if ( !this.range ) {
				return;
			}

			if ( window.getSelection ) {
				selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange( this.range );

				// Support: IE8
			} else {
				this.range.select();
			}

			// Support: IE
			// Setting the text selection kills the button focus in IE, but
			// restoring the focus doesn't kill the selection.
			this.button.focus();
		},

		_documentClick: {
			mousedown: function( event ) {
				if ( !this.isOpen ) {
					return;
				}

				if ( !$( event.target ).closest( ".ui-selectmenu-menu, #" +
					$.escapeSelector( this.ids.button ) ).length ) {
					this.close( event );
				}
			}
		},

		_buttonEvents: {

			// Prevent text selection from being reset when interacting with the selectmenu (#10144)
			mousedown: function() {
				var selection;

				if ( window.getSelection ) {
					selection = window.getSelection();
					if ( selection.rangeCount ) {
						this.range = selection.getRangeAt( 0 );
					}

					// Support: IE8
				} else {
					this.range = document.selection.createRange();
				}
			},

			click: function( event ) {
				this._setSelection();
				this._toggle( event );
			},

			keydown: function( event ) {
				var preventDefault = true;
				switch ( event.keyCode ) {
					case $.ui.keyCode.TAB:
					case $.ui.keyCode.ESCAPE:
						this.close( event );
						preventDefault = false;
						break;
					case $.ui.keyCode.ENTER:
						if ( this.isOpen ) {
							this._selectFocusedItem( event );
						}
						break;
					case $.ui.keyCode.UP:
						if ( event.altKey ) {
							this._toggle( event );
						} else {
							this._move( "prev", event );
						}
						break;
					case $.ui.keyCode.DOWN:
						if ( event.altKey ) {
							this._toggle( event );
						} else {
							this._move( "next", event );
						}
						break;
					case $.ui.keyCode.SPACE:
						if ( this.isOpen ) {
							this._selectFocusedItem( event );
						} else {
							this._toggle( event );
						}
						break;
					case $.ui.keyCode.LEFT:
						this._move( "prev", event );
						break;
					case $.ui.keyCode.RIGHT:
						this._move( "next", event );
						break;
					case $.ui.keyCode.HOME:
					case $.ui.keyCode.PAGE_UP:
						this._move( "first", event );
						break;
					case $.ui.keyCode.END:
					case $.ui.keyCode.PAGE_DOWN:
						this._move( "last", event );
						break;
					default:
						this.menu.trigger( event );
						preventDefault = false;
				}

				if ( preventDefault ) {
					event.preventDefault();
				}
			}
		},

		_selectFocusedItem: function( event ) {
			var item = this.menuItems.eq( this.focusIndex ).parent( "li" );
			if ( !item.hasClass( "ui-state-disabled" ) ) {
				this._select( item.data( "ui-selectmenu-item" ), event );
			}
		},

		_select: function( item, event ) {
			var oldIndex = this.element[ 0 ].selectedIndex;

			// Change native select element
			this.element[ 0 ].selectedIndex = item.index;
			this.buttonItem.replaceWith( this.buttonItem = this._renderButtonItem( item ) );
			this._setAria( item );
			this._trigger( "select", event, { item: item } );

			if ( item.index !== oldIndex ) {
				this._trigger( "change", event, { item: item } );
			}

			this.close( event );
		},

		_setAria: function( item ) {
			var id = this.menuItems.eq( item.index ).attr( "id" );

			this.button.attr( {
				"aria-labelledby": id,
				"aria-activedescendant": id
			} );
			this.menu.attr( "aria-activedescendant", id );
		},

		_setOption: function( key, value ) {
			if ( key === "icons" ) {
				var icon = this.button.find( "span.ui-icon" );
				this._removeClass( icon, null, this.options.icons.button )
				._addClass( icon, null, value.button );
			}

			this._super( key, value );

			if ( key === "appendTo" ) {
				this.menuWrap.appendTo( this._appendTo() );
			}

			if ( key === "width" ) {
				this._resizeButton();
			}
		},

		_setOptionDisabled: function( value ) {
			this._super( value );

			this.menuInstance.option( "disabled", value );
			this.button.attr( "aria-disabled", value );
			this._toggleClass( this.button, null, "ui-state-disabled", value );

			this.element.prop( "disabled", value );
			if ( value ) {
				this.button.attr( "tabindex", -1 );
				this.close();
			} else {
				this.button.attr( "tabindex", 0 );
			}
		},

		_appendTo: function() {
			var element = this.options.appendTo;

			if ( element ) {
				element = element.jquery || element.nodeType ?
					$( element ) :
					this.document.find( element ).eq( 0 );
			}

			if ( !element || !element[ 0 ] ) {
				element = this.element.closest( ".ui-front, dialog" );
			}

			if ( !element.length ) {
				element = this.document[ 0 ].body;
			}

			return element;
		},

		_toggleAttr: function() {
			this.button.attr( "aria-expanded", this.isOpen );

			// We can't use two _toggleClass() calls here, because we need to make sure
			// we always remove classes first and add them second, otherwise if both classes have the
			// same theme class, it will be removed after we add it.
			this._removeClass( this.button, "ui-selectmenu-button-" +
				( this.isOpen ? "closed" : "open" ) )
			._addClass( this.button, "ui-selectmenu-button-" +
				( this.isOpen ? "open" : "closed" ) )
			._toggleClass( this.menuWrap, "ui-selectmenu-open", null, this.isOpen );

			this.menu.attr( "aria-hidden", !this.isOpen );
		},

		_resizeButton: function() {
			var width = this.options.width;

			// For `width: false`, just remove inline style and stop
			if ( width === false ) {
				this.button.css( "width", "" );
				return;
			}

			// For `width: null`, match the width of the original element
			if ( width === null ) {
				width = this.element.show().outerWidth();
				this.element.hide();
			}

			this.button.outerWidth( width );
		},

		_resizeMenu: function() {
			this.menu.outerWidth( Math.max(
				this.button.outerWidth(),

				// Support: IE10
				// IE10 wraps long text (possibly a rounding bug)
				// so we add 1px to avoid the wrapping
				this.menu.width( "" ).outerWidth() + 1
			) );
		},

		_getCreateOptions: function() {
			var options = this._super();

			options.disabled = this.element.prop( "disabled" );

			return options;
		},

		_parseOptions: function( options ) {
			var that = this,
				data = [];
			options.each( function( index, item ) {
				if ( item.hidden ) {
					return;
				}

				data.push( that._parseOption( $( item ), index ) );
			} );
			this.items = data;
		},

		_parseOption: function( option, index ) {
			var optgroup = option.parent( "optgroup" );

			return {
				element: option,
				index: index,
				value: option.val(),
				label: option.text(),
				optgroup: optgroup.attr( "label" ) || "",
				disabled: optgroup.prop( "disabled" ) || option.prop( "disabled" )
			};
		},

		_destroy: function() {
			this._unbindFormResetHandler();
			this.menuWrap.remove();
			this.button.remove();
			this.element.show();
			this.element.removeUniqueId();
			this.labels.attr( "for", this.ids.element );
		}
	} ] );


	/*!
 * jQuery UI Slider 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Slider
//>>group: Widgets
//>>description: Displays a flexible slider with ranges and accessibility via keyboard.
//>>docs: http://api.jqueryui.com/slider/
//>>demos: http://jqueryui.com/slider/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/slider.css
//>>css.theme: ../../themes/base/theme.css


	var widgetsSlider = $.widget( "ui.slider", $.ui.mouse, {
		version: "1.13.0",
		widgetEventPrefix: "slide",

		options: {
			animate: false,
			classes: {
				"ui-slider": "ui-corner-all",
				"ui-slider-handle": "ui-corner-all",

				// Note: ui-widget-header isn't the most fittingly semantic framework class for this
				// element, but worked best visually with a variety of themes
				"ui-slider-range": "ui-corner-all ui-widget-header"
			},
			distance: 0,
			max: 100,
			min: 0,
			orientation: "horizontal",
			range: false,
			step: 1,
			value: 0,
			values: null,

			// Callbacks
			change: null,
			slide: null,
			start: null,
			stop: null
		},

		// Number of pages in a slider
		// (how many times can you page up/down to go through the whole range)
		numPages: 5,

		_create: function() {
			this._keySliding = false;
			this._mouseSliding = false;
			this._animateOff = true;
			this._handleIndex = null;
			this._detectOrientation();
			this._mouseInit();
			this._calculateNewMax();

			this._addClass( "ui-slider ui-slider-" + this.orientation,
				"ui-widget ui-widget-content" );

			this._refresh();

			this._animateOff = false;
		},

		_refresh: function() {
			this._createRange();
			this._createHandles();
			this._setupEvents();
			this._refreshValue();
		},

		_createHandles: function() {
			var i, handleCount,
				options = this.options,
				existingHandles = this.element.find( ".ui-slider-handle" ),
				handle = "<span tabindex='0'></span>",
				handles = [];

			handleCount = ( options.values && options.values.length ) || 1;

			if ( existingHandles.length > handleCount ) {
				existingHandles.slice( handleCount ).remove();
				existingHandles = existingHandles.slice( 0, handleCount );
			}

			for ( i = existingHandles.length; i < handleCount; i++ ) {
				handles.push( handle );
			}

			this.handles = existingHandles.add( $( handles.join( "" ) ).appendTo( this.element ) );

			this._addClass( this.handles, "ui-slider-handle", "ui-state-default" );

			this.handle = this.handles.eq( 0 );

			this.handles.each( function( i ) {
				$( this )
				.data( "ui-slider-handle-index", i )
				.attr( "tabIndex", 0 );
			} );
		},

		_createRange: function() {
			var options = this.options;

			if ( options.range ) {
				if ( options.range === true ) {
					if ( !options.values ) {
						options.values = [ this._valueMin(), this._valueMin() ];
					} else if ( options.values.length && options.values.length !== 2 ) {
						options.values = [ options.values[ 0 ], options.values[ 0 ] ];
					} else if ( Array.isArray( options.values ) ) {
						options.values = options.values.slice( 0 );
					}
				}

				if ( !this.range || !this.range.length ) {
					this.range = $( "<div>" )
					.appendTo( this.element );

					this._addClass( this.range, "ui-slider-range" );
				} else {
					this._removeClass( this.range, "ui-slider-range-min ui-slider-range-max" );

					// Handle range switching from true to min/max
					this.range.css( {
						"left": "",
						"bottom": ""
					} );
				}
				if ( options.range === "min" || options.range === "max" ) {
					this._addClass( this.range, "ui-slider-range-" + options.range );
				}
			} else {
				if ( this.range ) {
					this.range.remove();
				}
				this.range = null;
			}
		},

		_setupEvents: function() {
			this._off( this.handles );
			this._on( this.handles, this._handleEvents );
			this._hoverable( this.handles );
			this._focusable( this.handles );
		},

		_destroy: function() {
			this.handles.remove();
			if ( this.range ) {
				this.range.remove();
			}

			this._mouseDestroy();
		},

		_mouseCapture: function( event ) {
			var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle,
				that = this,
				o = this.options;

			if ( o.disabled ) {
				return false;
			}

			this.elementSize = {
				width: this.element.outerWidth(),
				height: this.element.outerHeight()
			};
			this.elementOffset = this.element.offset();

			position = { x: event.pageX, y: event.pageY };
			normValue = this._normValueFromMouse( position );
			distance = this._valueMax() - this._valueMin() + 1;
			this.handles.each( function( i ) {
				var thisDistance = Math.abs( normValue - that.values( i ) );
				if ( ( distance > thisDistance ) ||
					( distance === thisDistance &&
						( i === that._lastChangedValue || that.values( i ) === o.min ) ) ) {
					distance = thisDistance;
					closestHandle = $( this );
					index = i;
				}
			} );

			allowed = this._start( event, index );
			if ( allowed === false ) {
				return false;
			}
			this._mouseSliding = true;

			this._handleIndex = index;

			this._addClass( closestHandle, null, "ui-state-active" );
			closestHandle.trigger( "focus" );

			offset = closestHandle.offset();
			mouseOverHandle = !$( event.target ).parents().addBack().is( ".ui-slider-handle" );
			this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
				left: event.pageX - offset.left - ( closestHandle.width() / 2 ),
				top: event.pageY - offset.top -
					( closestHandle.height() / 2 ) -
					( parseInt( closestHandle.css( "borderTopWidth" ), 10 ) || 0 ) -
					( parseInt( closestHandle.css( "borderBottomWidth" ), 10 ) || 0 ) +
					( parseInt( closestHandle.css( "marginTop" ), 10 ) || 0 )
			};

			if ( !this.handles.hasClass( "ui-state-hover" ) ) {
				this._slide( event, index, normValue );
			}
			this._animateOff = true;
			return true;
		},

		_mouseStart: function() {
			return true;
		},

		_mouseDrag: function( event ) {
			var position = { x: event.pageX, y: event.pageY },
				normValue = this._normValueFromMouse( position );

			this._slide( event, this._handleIndex, normValue );

			return false;
		},

		_mouseStop: function( event ) {
			this._removeClass( this.handles, null, "ui-state-active" );
			this._mouseSliding = false;

			this._stop( event, this._handleIndex );
			this._change( event, this._handleIndex );

			this._handleIndex = null;
			this._clickOffset = null;
			this._animateOff = false;

			return false;
		},

		_detectOrientation: function() {
			this.orientation = ( this.options.orientation === "vertical" ) ? "vertical" : "horizontal";
		},

		_normValueFromMouse: function( position ) {
			var pixelTotal,
				pixelMouse,
				percentMouse,
				valueTotal,
				valueMouse;

			if ( this.orientation === "horizontal" ) {
				pixelTotal = this.elementSize.width;
				pixelMouse = position.x - this.elementOffset.left -
					( this._clickOffset ? this._clickOffset.left : 0 );
			} else {
				pixelTotal = this.elementSize.height;
				pixelMouse = position.y - this.elementOffset.top -
					( this._clickOffset ? this._clickOffset.top : 0 );
			}

			percentMouse = ( pixelMouse / pixelTotal );
			if ( percentMouse > 1 ) {
				percentMouse = 1;
			}
			if ( percentMouse < 0 ) {
				percentMouse = 0;
			}
			if ( this.orientation === "vertical" ) {
				percentMouse = 1 - percentMouse;
			}

			valueTotal = this._valueMax() - this._valueMin();
			valueMouse = this._valueMin() + percentMouse * valueTotal;

			return this._trimAlignValue( valueMouse );
		},

		_uiHash: function( index, value, values ) {
			var uiHash = {
				handle: this.handles[ index ],
				handleIndex: index,
				value: value !== undefined ? value : this.value()
			};

			if ( this._hasMultipleValues() ) {
				uiHash.value = value !== undefined ? value : this.values( index );
				uiHash.values = values || this.values();
			}

			return uiHash;
		},

		_hasMultipleValues: function() {
			return this.options.values && this.options.values.length;
		},

		_start: function( event, index ) {
			return this._trigger( "start", event, this._uiHash( index ) );
		},

		_slide: function( event, index, newVal ) {
			var allowed, otherVal,
				currentValue = this.value(),
				newValues = this.values();

			if ( this._hasMultipleValues() ) {
				otherVal = this.values( index ? 0 : 1 );
				currentValue = this.values( index );

				if ( this.options.values.length === 2 && this.options.range === true ) {
					newVal =  index === 0 ? Math.min( otherVal, newVal ) : Math.max( otherVal, newVal );
				}

				newValues[ index ] = newVal;
			}

			if ( newVal === currentValue ) {
				return;
			}

			allowed = this._trigger( "slide", event, this._uiHash( index, newVal, newValues ) );

			// A slide can be canceled by returning false from the slide callback
			if ( allowed === false ) {
				return;
			}

			if ( this._hasMultipleValues() ) {
				this.values( index, newVal );
			} else {
				this.value( newVal );
			}
		},

		_stop: function( event, index ) {
			this._trigger( "stop", event, this._uiHash( index ) );
		},

		_change: function( event, index ) {
			if ( !this._keySliding && !this._mouseSliding ) {

				//store the last changed value index for reference when handles overlap
				this._lastChangedValue = index;
				this._trigger( "change", event, this._uiHash( index ) );
			}
		},

		value: function( newValue ) {
			if ( arguments.length ) {
				this.options.value = this._trimAlignValue( newValue );
				this._refreshValue();
				this._change( null, 0 );
				return;
			}

			return this._value();
		},

		values: function( index, newValue ) {
			var vals,
				newValues,
				i;

			if ( arguments.length > 1 ) {
				this.options.values[ index ] = this._trimAlignValue( newValue );
				this._refreshValue();
				this._change( null, index );
				return;
			}

			if ( arguments.length ) {
				if ( Array.isArray( arguments[ 0 ] ) ) {
					vals = this.options.values;
					newValues = arguments[ 0 ];
					for ( i = 0; i < vals.length; i += 1 ) {
						vals[ i ] = this._trimAlignValue( newValues[ i ] );
						this._change( null, i );
					}
					this._refreshValue();
				} else {
					if ( this._hasMultipleValues() ) {
						return this._values( index );
					} else {
						return this.value();
					}
				}
			} else {
				return this._values();
			}
		},

		_setOption: function( key, value ) {
			var i,
				valsLength = 0;

			if ( key === "range" && this.options.range === true ) {
				if ( value === "min" ) {
					this.options.value = this._values( 0 );
					this.options.values = null;
				} else if ( value === "max" ) {
					this.options.value = this._values( this.options.values.length - 1 );
					this.options.values = null;
				}
			}

			if ( Array.isArray( this.options.values ) ) {
				valsLength = this.options.values.length;
			}

			this._super( key, value );

			switch ( key ) {
				case "orientation":
					this._detectOrientation();
					this._removeClass( "ui-slider-horizontal ui-slider-vertical" )
					._addClass( "ui-slider-" + this.orientation );
					this._refreshValue();
					if ( this.options.range ) {
						this._refreshRange( value );
					}

					// Reset positioning from previous orientation
					this.handles.css( value === "horizontal" ? "bottom" : "left", "" );
					break;
				case "value":
					this._animateOff = true;
					this._refreshValue();
					this._change( null, 0 );
					this._animateOff = false;
					break;
				case "values":
					this._animateOff = true;
					this._refreshValue();

					// Start from the last handle to prevent unreachable handles (#9046)
					for ( i = valsLength - 1; i >= 0; i-- ) {
						this._change( null, i );
					}
					this._animateOff = false;
					break;
				case "step":
				case "min":
				case "max":
					this._animateOff = true;
					this._calculateNewMax();
					this._refreshValue();
					this._animateOff = false;
					break;
				case "range":
					this._animateOff = true;
					this._refresh();
					this._animateOff = false;
					break;
			}
		},

		_setOptionDisabled: function( value ) {
			this._super( value );

			this._toggleClass( null, "ui-state-disabled", !!value );
		},

		//internal value getter
		// _value() returns value trimmed by min and max, aligned by step
		_value: function() {
			var val = this.options.value;
			val = this._trimAlignValue( val );

			return val;
		},

		//internal values getter
		// _values() returns array of values trimmed by min and max, aligned by step
		// _values( index ) returns single value trimmed by min and max, aligned by step
		_values: function( index ) {
			var val,
				vals,
				i;

			if ( arguments.length ) {
				val = this.options.values[ index ];
				val = this._trimAlignValue( val );

				return val;
			} else if ( this._hasMultipleValues() ) {

				// .slice() creates a copy of the array
				// this copy gets trimmed by min and max and then returned
				vals = this.options.values.slice();
				for ( i = 0; i < vals.length; i += 1 ) {
					vals[ i ] = this._trimAlignValue( vals[ i ] );
				}

				return vals;
			} else {
				return [];
			}
		},

		// Returns the step-aligned value that val is closest to, between (inclusive) min and max
		_trimAlignValue: function( val ) {
			if ( val <= this._valueMin() ) {
				return this._valueMin();
			}
			if ( val >= this._valueMax() ) {
				return this._valueMax();
			}
			var step = ( this.options.step > 0 ) ? this.options.step : 1,
				valModStep = ( val - this._valueMin() ) % step,
				alignValue = val - valModStep;

			if ( Math.abs( valModStep ) * 2 >= step ) {
				alignValue += ( valModStep > 0 ) ? step : ( -step );
			}

			// Since JavaScript has problems with large floats, round
			// the final value to 5 digits after the decimal point (see #4124)
			return parseFloat( alignValue.toFixed( 5 ) );
		},

		_calculateNewMax: function() {
			var max = this.options.max,
				min = this._valueMin(),
				step = this.options.step,
				aboveMin = Math.round( ( max - min ) / step ) * step;
			max = aboveMin + min;
			if ( max > this.options.max ) {

				//If max is not divisible by step, rounding off may increase its value
				max -= step;
			}
			this.max = parseFloat( max.toFixed( this._precision() ) );
		},

		_precision: function() {
			var precision = this._precisionOf( this.options.step );
			if ( this.options.min !== null ) {
				precision = Math.max( precision, this._precisionOf( this.options.min ) );
			}
			return precision;
		},

		_precisionOf: function( num ) {
			var str = num.toString(),
				decimal = str.indexOf( "." );
			return decimal === -1 ? 0 : str.length - decimal - 1;
		},

		_valueMin: function() {
			return this.options.min;
		},

		_valueMax: function() {
			return this.max;
		},

		_refreshRange: function( orientation ) {
			if ( orientation === "vertical" ) {
				this.range.css( { "width": "", "left": "" } );
			}
			if ( orientation === "horizontal" ) {
				this.range.css( { "height": "", "bottom": "" } );
			}
		},

		_refreshValue: function() {
			var lastValPercent, valPercent, value, valueMin, valueMax,
				oRange = this.options.range,
				o = this.options,
				that = this,
				animate = ( !this._animateOff ) ? o.animate : false,
				_set = {};

			if ( this._hasMultipleValues() ) {
				this.handles.each( function( i ) {
					valPercent = ( that.values( i ) - that._valueMin() ) / ( that._valueMax() -
						that._valueMin() ) * 100;
					_set[ that.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
					$( this ).stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );
					if ( that.options.range === true ) {
						if ( that.orientation === "horizontal" ) {
							if ( i === 0 ) {
								that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
									left: valPercent + "%"
								}, o.animate );
							}
							if ( i === 1 ) {
								that.range[ animate ? "animate" : "css" ]( {
									width: ( valPercent - lastValPercent ) + "%"
								}, {
									queue: false,
									duration: o.animate
								} );
							}
						} else {
							if ( i === 0 ) {
								that.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
									bottom: ( valPercent ) + "%"
								}, o.animate );
							}
							if ( i === 1 ) {
								that.range[ animate ? "animate" : "css" ]( {
									height: ( valPercent - lastValPercent ) + "%"
								}, {
									queue: false,
									duration: o.animate
								} );
							}
						}
					}
					lastValPercent = valPercent;
				} );
			} else {
				value = this.value();
				valueMin = this._valueMin();
				valueMax = this._valueMax();
				valPercent = ( valueMax !== valueMin ) ?
					( value - valueMin ) / ( valueMax - valueMin ) * 100 :
					0;
				_set[ this.orientation === "horizontal" ? "left" : "bottom" ] = valPercent + "%";
				this.handle.stop( 1, 1 )[ animate ? "animate" : "css" ]( _set, o.animate );

				if ( oRange === "min" && this.orientation === "horizontal" ) {
					this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
						width: valPercent + "%"
					}, o.animate );
				}
				if ( oRange === "max" && this.orientation === "horizontal" ) {
					this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
						width: ( 100 - valPercent ) + "%"
					}, o.animate );
				}
				if ( oRange === "min" && this.orientation === "vertical" ) {
					this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
						height: valPercent + "%"
					}, o.animate );
				}
				if ( oRange === "max" && this.orientation === "vertical" ) {
					this.range.stop( 1, 1 )[ animate ? "animate" : "css" ]( {
						height: ( 100 - valPercent ) + "%"
					}, o.animate );
				}
			}
		},

		_handleEvents: {
			keydown: function( event ) {
				var allowed, curVal, newVal, step,
					index = $( event.target ).data( "ui-slider-handle-index" );

				switch ( event.keyCode ) {
					case $.ui.keyCode.HOME:
					case $.ui.keyCode.END:
					case $.ui.keyCode.PAGE_UP:
					case $.ui.keyCode.PAGE_DOWN:
					case $.ui.keyCode.UP:
					case $.ui.keyCode.RIGHT:
					case $.ui.keyCode.DOWN:
					case $.ui.keyCode.LEFT:
						event.preventDefault();
						if ( !this._keySliding ) {
							this._keySliding = true;
							this._addClass( $( event.target ), null, "ui-state-active" );
							allowed = this._start( event, index );
							if ( allowed === false ) {
								return;
							}
						}
						break;
				}

				step = this.options.step;
				if ( this._hasMultipleValues() ) {
					curVal = newVal = this.values( index );
				} else {
					curVal = newVal = this.value();
				}

				switch ( event.keyCode ) {
					case $.ui.keyCode.HOME:
						newVal = this._valueMin();
						break;
					case $.ui.keyCode.END:
						newVal = this._valueMax();
						break;
					case $.ui.keyCode.PAGE_UP:
						newVal = this._trimAlignValue(
							curVal + ( ( this._valueMax() - this._valueMin() ) / this.numPages )
						);
						break;
					case $.ui.keyCode.PAGE_DOWN:
						newVal = this._trimAlignValue(
							curVal - ( ( this._valueMax() - this._valueMin() ) / this.numPages ) );
						break;
					case $.ui.keyCode.UP:
					case $.ui.keyCode.RIGHT:
						if ( curVal === this._valueMax() ) {
							return;
						}
						newVal = this._trimAlignValue( curVal + step );
						break;
					case $.ui.keyCode.DOWN:
					case $.ui.keyCode.LEFT:
						if ( curVal === this._valueMin() ) {
							return;
						}
						newVal = this._trimAlignValue( curVal - step );
						break;
				}

				this._slide( event, index, newVal );
			},
			keyup: function( event ) {
				var index = $( event.target ).data( "ui-slider-handle-index" );

				if ( this._keySliding ) {
					this._keySliding = false;
					this._stop( event, index );
					this._change( event, index );
					this._removeClass( $( event.target ), null, "ui-state-active" );
				}
			}
		}
	} );


	/*!
 * jQuery UI Sortable 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Sortable
//>>group: Interactions
//>>description: Enables items in a list to be sorted using the mouse.
//>>docs: http://api.jqueryui.com/sortable/
//>>demos: http://jqueryui.com/sortable/
//>>css.structure: ../../themes/base/sortable.css


	var widgetsSortable = $.widget( "ui.sortable", $.ui.mouse, {
		version: "1.13.0",
		widgetEventPrefix: "sort",
		ready: false,
		options: {
			appendTo: "parent",
			axis: false,
			connectWith: false,
			containment: false,
			cursor: "auto",
			cursorAt: false,
			dropOnEmpty: true,
			forcePlaceholderSize: false,
			forceHelperSize: false,
			grid: false,
			handle: false,
			helper: "original",
			items: "> *",
			opacity: false,
			placeholder: false,
			revert: false,
			scroll: true,
			scrollSensitivity: 20,
			scrollSpeed: 20,
			scope: "default",
			tolerance: "intersect",
			zIndex: 1000,

			// Callbacks
			activate: null,
			beforeStop: null,
			change: null,
			deactivate: null,
			out: null,
			over: null,
			receive: null,
			remove: null,
			sort: null,
			start: null,
			stop: null,
			update: null
		},

		_isOverAxis: function( x, reference, size ) {
			return ( x >= reference ) && ( x < ( reference + size ) );
		},

		_isFloating: function( item ) {
			return ( /left|right/ ).test( item.css( "float" ) ) ||
				( /inline|table-cell/ ).test( item.css( "display" ) );
		},

		_create: function() {
			this.containerCache = {};
			this._addClass( "ui-sortable" );

			//Get the items
			this.refresh();

			//Let's determine the parent's offset
			this.offset = this.element.offset();

			//Initialize mouse events for interaction
			this._mouseInit();

			this._setHandleClassName();

			//We're ready to go
			this.ready = true;

		},

		_setOption: function( key, value ) {
			this._super( key, value );

			if ( key === "handle" ) {
				this._setHandleClassName();
			}
		},

		_setHandleClassName: function() {
			var that = this;
			this._removeClass( this.element.find( ".ui-sortable-handle" ), "ui-sortable-handle" );
			$.each( this.items, function() {
				that._addClass(
					this.instance.options.handle ?
						this.item.find( this.instance.options.handle ) :
						this.item,
					"ui-sortable-handle"
				);
			} );
		},

		_destroy: function() {
			this._mouseDestroy();

			for ( var i = this.items.length - 1; i >= 0; i-- ) {
				this.items[ i ].item.removeData( this.widgetName + "-item" );
			}

			return this;
		},

		_mouseCapture: function( event, overrideHandle ) {
			var currentItem = null,
				validHandle = false,
				that = this;

			if ( this.reverting ) {
				return false;
			}

			if ( this.options.disabled || this.options.type === "static" ) {
				return false;
			}

			//We have to refresh the items data once first
			this._refreshItems( event );

			//Find out if the clicked node (or one of its parents) is a actual item in this.items
			$( event.target ).parents().each( function() {
				if ( $.data( this, that.widgetName + "-item" ) === that ) {
					currentItem = $( this );
					return false;
				}
			} );
			if ( $.data( event.target, that.widgetName + "-item" ) === that ) {
				currentItem = $( event.target );
			}

			if ( !currentItem ) {
				return false;
			}
			if ( this.options.handle && !overrideHandle ) {
				$( this.options.handle, currentItem ).find( "*" ).addBack().each( function() {
					if ( this === event.target ) {
						validHandle = true;
					}
				} );
				if ( !validHandle ) {
					return false;
				}
			}

			this.currentItem = currentItem;
			this._removeCurrentsFromItems();
			return true;

		},

		_mouseStart: function( event, overrideHandle, noActivation ) {

			var i, body,
				o = this.options;

			this.currentContainer = this;

			//We only need to call refreshPositions, because the refreshItems call has been moved to
			// mouseCapture
			this.refreshPositions();

			//Prepare the dragged items parent
			this.appendTo = $( o.appendTo !== "parent" ?
				o.appendTo :
				this.currentItem.parent() );

			//Create and append the visible helper
			this.helper = this._createHelper( event );

			//Cache the helper size
			this._cacheHelperProportions();

			/*
		 * - Position generation -
		 * This block generates everything position related - it's the core of draggables.
		 */

			//Cache the margins of the original element
			this._cacheMargins();

			//The element's absolute position on the page minus margins
			this.offset = this.currentItem.offset();
			this.offset = {
				top: this.offset.top - this.margins.top,
				left: this.offset.left - this.margins.left
			};

			$.extend( this.offset, {
				click: { //Where the click happened, relative to the element
					left: event.pageX - this.offset.left,
					top: event.pageY - this.offset.top
				},

				// This is a relative to absolute position minus the actual position calculation -
				// only used for relative positioned helper
				relative: this._getRelativeOffset()
			} );

			// After we get the helper offset, but before we get the parent offset we can
			// change the helper's position to absolute
			// TODO: Still need to figure out a way to make relative sorting possible
			this.helper.css( "position", "absolute" );
			this.cssPosition = this.helper.css( "position" );

			//Adjust the mouse offset relative to the helper if "cursorAt" is supplied
			if ( o.cursorAt ) {
				this._adjustOffsetFromHelper( o.cursorAt );
			}

			//Cache the former DOM position
			this.domPosition = {
				prev: this.currentItem.prev()[ 0 ],
				parent: this.currentItem.parent()[ 0 ]
			};

			// If the helper is not the original, hide the original so it's not playing any role during
			// the drag, won't cause anything bad this way
			if ( this.helper[ 0 ] !== this.currentItem[ 0 ] ) {
				this.currentItem.hide();
			}

			//Create the placeholder
			this._createPlaceholder();

			//Get the next scrolling parent
			this.scrollParent = this.placeholder.scrollParent();

			$.extend( this.offset, {
				parent: this._getParentOffset()
			} );

			//Set a containment if given in the options
			if ( o.containment ) {
				this._setContainment();
			}

			if ( o.cursor && o.cursor !== "auto" ) { // cursor option
				body = this.document.find( "body" );

				// Support: IE
				this.storedCursor = body.css( "cursor" );
				body.css( "cursor", o.cursor );

				this.storedStylesheet =
					$( "<style>*{ cursor: " + o.cursor + " !important; }</style>" ).appendTo( body );
			}

			// We need to make sure to grab the zIndex before setting the
			// opacity, because setting the opacity to anything lower than 1
			// causes the zIndex to change from "auto" to 0.
			if ( o.zIndex ) { // zIndex option
				if ( this.helper.css( "zIndex" ) ) {
					this._storedZIndex = this.helper.css( "zIndex" );
				}
				this.helper.css( "zIndex", o.zIndex );
			}

			if ( o.opacity ) { // opacity option
				if ( this.helper.css( "opacity" ) ) {
					this._storedOpacity = this.helper.css( "opacity" );
				}
				this.helper.css( "opacity", o.opacity );
			}

			//Prepare scrolling
			if ( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				this.scrollParent[ 0 ].tagName !== "HTML" ) {
				this.overflowOffset = this.scrollParent.offset();
			}

			//Call callbacks
			this._trigger( "start", event, this._uiHash() );

			//Recache the helper size
			if ( !this._preserveHelperProportions ) {
				this._cacheHelperProportions();
			}

			//Post "activate" events to possible containers
			if ( !noActivation ) {
				for ( i = this.containers.length - 1; i >= 0; i-- ) {
					this.containers[ i ]._trigger( "activate", event, this._uiHash( this ) );
				}
			}

			//Prepare possible droppables
			if ( $.ui.ddmanager ) {
				$.ui.ddmanager.current = this;
			}

			if ( $.ui.ddmanager && !o.dropBehaviour ) {
				$.ui.ddmanager.prepareOffsets( this, event );
			}

			this.dragging = true;

			this._addClass( this.helper, "ui-sortable-helper" );

			//Move the helper, if needed
			if ( !this.helper.parent().is( this.appendTo ) ) {
				this.helper.detach().appendTo( this.appendTo );

				//Update position
				this.offset.parent = this._getParentOffset();
			}

			//Generate the original position
			this.position = this.originalPosition = this._generatePosition( event );
			this.originalPageX = event.pageX;
			this.originalPageY = event.pageY;
			this.lastPositionAbs = this.positionAbs = this._convertPositionTo( "absolute" );

			this._mouseDrag( event );

			return true;

		},

		_scroll: function( event ) {
			var o = this.options,
				scrolled = false;

			if ( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				this.scrollParent[ 0 ].tagName !== "HTML" ) {

				if ( ( this.overflowOffset.top + this.scrollParent[ 0 ].offsetHeight ) -
					event.pageY < o.scrollSensitivity ) {
					this.scrollParent[ 0 ].scrollTop =
						scrolled = this.scrollParent[ 0 ].scrollTop + o.scrollSpeed;
				} else if ( event.pageY - this.overflowOffset.top < o.scrollSensitivity ) {
					this.scrollParent[ 0 ].scrollTop =
						scrolled = this.scrollParent[ 0 ].scrollTop - o.scrollSpeed;
				}

				if ( ( this.overflowOffset.left + this.scrollParent[ 0 ].offsetWidth ) -
					event.pageX < o.scrollSensitivity ) {
					this.scrollParent[ 0 ].scrollLeft = scrolled =
						this.scrollParent[ 0 ].scrollLeft + o.scrollSpeed;
				} else if ( event.pageX - this.overflowOffset.left < o.scrollSensitivity ) {
					this.scrollParent[ 0 ].scrollLeft = scrolled =
						this.scrollParent[ 0 ].scrollLeft - o.scrollSpeed;
				}

			} else {

				if ( event.pageY - this.document.scrollTop() < o.scrollSensitivity ) {
					scrolled = this.document.scrollTop( this.document.scrollTop() - o.scrollSpeed );
				} else if ( this.window.height() - ( event.pageY - this.document.scrollTop() ) <
					o.scrollSensitivity ) {
					scrolled = this.document.scrollTop( this.document.scrollTop() + o.scrollSpeed );
				}

				if ( event.pageX - this.document.scrollLeft() < o.scrollSensitivity ) {
					scrolled = this.document.scrollLeft(
						this.document.scrollLeft() - o.scrollSpeed
					);
				} else if ( this.window.width() - ( event.pageX - this.document.scrollLeft() ) <
					o.scrollSensitivity ) {
					scrolled = this.document.scrollLeft(
						this.document.scrollLeft() + o.scrollSpeed
					);
				}

			}

			return scrolled;
		},

		_mouseDrag: function( event ) {
			var i, item, itemElement, intersection,
				o = this.options;

			//Compute the helpers position
			this.position = this._generatePosition( event );
			this.positionAbs = this._convertPositionTo( "absolute" );

			//Set the helper position
			if ( !this.options.axis || this.options.axis !== "y" ) {
				this.helper[ 0 ].style.left = this.position.left + "px";
			}
			if ( !this.options.axis || this.options.axis !== "x" ) {
				this.helper[ 0 ].style.top = this.position.top + "px";
			}

			//Post events to containers
			this._contactContainers( event );

			if ( this.innermostContainer !== null ) {

				//Do scrolling
				if ( o.scroll ) {
					if ( this._scroll( event ) !== false ) {

						//Update item positions used in position checks
						this._refreshItemPositions( true );

						if ( $.ui.ddmanager && !o.dropBehaviour ) {
							$.ui.ddmanager.prepareOffsets( this, event );
						}
					}
				}

				this.dragDirection = {
					vertical: this._getDragVerticalDirection(),
					horizontal: this._getDragHorizontalDirection()
				};

				//Rearrange
				for ( i = this.items.length - 1; i >= 0; i-- ) {

					//Cache variables and intersection, continue if no intersection
					item = this.items[ i ];
					itemElement = item.item[ 0 ];
					intersection = this._intersectsWithPointer( item );
					if ( !intersection ) {
						continue;
					}

					// Only put the placeholder inside the current Container, skip all
					// items from other containers. This works because when moving
					// an item from one container to another the
					// currentContainer is switched before the placeholder is moved.
					//
					// Without this, moving items in "sub-sortables" can cause
					// the placeholder to jitter between the outer and inner container.
					if ( item.instance !== this.currentContainer ) {
						continue;
					}

					// Cannot intersect with itself
					// no useless actions that have been done before
					// no action if the item moved is the parent of the item checked
					if ( itemElement !== this.currentItem[ 0 ] &&
						this.placeholder[ intersection === 1 ?
							"next" : "prev" ]()[ 0 ] !== itemElement &&
						!$.contains( this.placeholder[ 0 ], itemElement ) &&
						( this.options.type === "semi-dynamic" ?
								!$.contains( this.element[ 0 ], itemElement ) :
								true
						)
					) {

						this.direction = intersection === 1 ? "down" : "up";

						if ( this.options.tolerance === "pointer" ||
							this._intersectsWithSides( item ) ) {
							this._rearrange( event, item );
						} else {
							break;
						}

						this._trigger( "change", event, this._uiHash() );
						break;
					}
				}
			}

			//Interconnect with droppables
			if ( $.ui.ddmanager ) {
				$.ui.ddmanager.drag( this, event );
			}

			//Call callbacks
			this._trigger( "sort", event, this._uiHash() );

			this.lastPositionAbs = this.positionAbs;
			return false;

		},

		_mouseStop: function( event, noPropagation ) {

			if ( !event ) {
				return;
			}

			//If we are using droppables, inform the manager about the drop
			if ( $.ui.ddmanager && !this.options.dropBehaviour ) {
				$.ui.ddmanager.drop( this, event );
			}

			if ( this.options.revert ) {
				var that = this,
					cur = this.placeholder.offset(),
					axis = this.options.axis,
					animation = {};

				if ( !axis || axis === "x" ) {
					animation.left = cur.left - this.offset.parent.left - this.margins.left +
						( this.offsetParent[ 0 ] === this.document[ 0 ].body ?
								0 :
								this.offsetParent[ 0 ].scrollLeft
						);
				}
				if ( !axis || axis === "y" ) {
					animation.top = cur.top - this.offset.parent.top - this.margins.top +
						( this.offsetParent[ 0 ] === this.document[ 0 ].body ?
								0 :
								this.offsetParent[ 0 ].scrollTop
						);
				}
				this.reverting = true;
				$( this.helper ).animate(
					animation,
					parseInt( this.options.revert, 10 ) || 500,
					function() {
						that._clear( event );
					}
				);
			} else {
				this._clear( event, noPropagation );
			}

			return false;

		},

		cancel: function() {

			if ( this.dragging ) {

				this._mouseUp( new $.Event( "mouseup", { target: null } ) );

				if ( this.options.helper === "original" ) {
					this.currentItem.css( this._storedCSS );
					this._removeClass( this.currentItem, "ui-sortable-helper" );
				} else {
					this.currentItem.show();
				}

				//Post deactivating events to containers
				for ( var i = this.containers.length - 1; i >= 0; i-- ) {
					this.containers[ i ]._trigger( "deactivate", null, this._uiHash( this ) );
					if ( this.containers[ i ].containerCache.over ) {
						this.containers[ i ]._trigger( "out", null, this._uiHash( this ) );
						this.containers[ i ].containerCache.over = 0;
					}
				}

			}

			if ( this.placeholder ) {

				//$(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately,
				// it unbinds ALL events from the original node!
				if ( this.placeholder[ 0 ].parentNode ) {
					this.placeholder[ 0 ].parentNode.removeChild( this.placeholder[ 0 ] );
				}
				if ( this.options.helper !== "original" && this.helper &&
					this.helper[ 0 ].parentNode ) {
					this.helper.remove();
				}

				$.extend( this, {
					helper: null,
					dragging: false,
					reverting: false,
					_noFinalSort: null
				} );

				if ( this.domPosition.prev ) {
					$( this.domPosition.prev ).after( this.currentItem );
				} else {
					$( this.domPosition.parent ).prepend( this.currentItem );
				}
			}

			return this;

		},

		serialize: function( o ) {

			var items = this._getItemsAsjQuery( o && o.connected ),
				str = [];
			o = o || {};

			$( items ).each( function() {
				var res = ( $( o.item || this ).attr( o.attribute || "id" ) || "" )
				.match( o.expression || ( /(.+)[\-=_](.+)/ ) );
				if ( res ) {
					str.push(
						( o.key || res[ 1 ] + "[]" ) +
						"=" + ( o.key && o.expression ? res[ 1 ] : res[ 2 ] ) );
				}
			} );

			if ( !str.length && o.key ) {
				str.push( o.key + "=" );
			}

			return str.join( "&" );

		},

		toArray: function( o ) {

			var items = this._getItemsAsjQuery( o && o.connected ),
				ret = [];

			o = o || {};

			items.each( function() {
				ret.push( $( o.item || this ).attr( o.attribute || "id" ) || "" );
			} );
			return ret;

		},

		/* Be careful with the following core functions */
		_intersectsWith: function( item ) {

			var x1 = this.positionAbs.left,
				x2 = x1 + this.helperProportions.width,
				y1 = this.positionAbs.top,
				y2 = y1 + this.helperProportions.height,
				l = item.left,
				r = l + item.width,
				t = item.top,
				b = t + item.height,
				dyClick = this.offset.click.top,
				dxClick = this.offset.click.left,
				isOverElementHeight = ( this.options.axis === "x" ) || ( ( y1 + dyClick ) > t &&
					( y1 + dyClick ) < b ),
				isOverElementWidth = ( this.options.axis === "y" ) || ( ( x1 + dxClick ) > l &&
					( x1 + dxClick ) < r ),
				isOverElement = isOverElementHeight && isOverElementWidth;

			if ( this.options.tolerance === "pointer" ||
				this.options.forcePointerForContainers ||
				( this.options.tolerance !== "pointer" &&
					this.helperProportions[ this.floating ? "width" : "height" ] >
					item[ this.floating ? "width" : "height" ] )
			) {
				return isOverElement;
			} else {

				return ( l < x1 + ( this.helperProportions.width / 2 ) && // Right Half
					x2 - ( this.helperProportions.width / 2 ) < r && // Left Half
					t < y1 + ( this.helperProportions.height / 2 ) && // Bottom Half
					y2 - ( this.helperProportions.height / 2 ) < b ); // Top Half

			}
		},

		_intersectsWithPointer: function( item ) {
			var verticalDirection, horizontalDirection,
				isOverElementHeight = ( this.options.axis === "x" ) ||
					this._isOverAxis(
						this.positionAbs.top + this.offset.click.top, item.top, item.height ),
				isOverElementWidth = ( this.options.axis === "y" ) ||
					this._isOverAxis(
						this.positionAbs.left + this.offset.click.left, item.left, item.width ),
				isOverElement = isOverElementHeight && isOverElementWidth;

			if ( !isOverElement ) {
				return false;
			}

			verticalDirection = this.dragDirection.vertical;
			horizontalDirection = this.dragDirection.horizontal;

			return this.floating ?
				( ( horizontalDirection === "right" || verticalDirection === "down" ) ? 2 : 1 ) :
				( verticalDirection && ( verticalDirection === "down" ? 2 : 1 ) );

		},

		_intersectsWithSides: function( item ) {

			var isOverBottomHalf = this._isOverAxis( this.positionAbs.top +
					this.offset.click.top, item.top + ( item.height / 2 ), item.height ),
				isOverRightHalf = this._isOverAxis( this.positionAbs.left +
					this.offset.click.left, item.left + ( item.width / 2 ), item.width ),
				verticalDirection = this.dragDirection.vertical,
				horizontalDirection = this.dragDirection.horizontal;

			if ( this.floating && horizontalDirection ) {
				return ( ( horizontalDirection === "right" && isOverRightHalf ) ||
					( horizontalDirection === "left" && !isOverRightHalf ) );
			} else {
				return verticalDirection && ( ( verticalDirection === "down" && isOverBottomHalf ) ||
					( verticalDirection === "up" && !isOverBottomHalf ) );
			}

		},

		_getDragVerticalDirection: function() {
			var delta = this.positionAbs.top - this.lastPositionAbs.top;
			return delta !== 0 && ( delta > 0 ? "down" : "up" );
		},

		_getDragHorizontalDirection: function() {
			var delta = this.positionAbs.left - this.lastPositionAbs.left;
			return delta !== 0 && ( delta > 0 ? "right" : "left" );
		},

		refresh: function( event ) {
			this._refreshItems( event );
			this._setHandleClassName();
			this.refreshPositions();
			return this;
		},

		_connectWith: function() {
			var options = this.options;
			return options.connectWith.constructor === String ?
				[ options.connectWith ] :
				options.connectWith;
		},

		_getItemsAsjQuery: function( connected ) {

			var i, j, cur, inst,
				items = [],
				queries = [],
				connectWith = this._connectWith();

			if ( connectWith && connected ) {
				for ( i = connectWith.length - 1; i >= 0; i-- ) {
					cur = $( connectWith[ i ], this.document[ 0 ] );
					for ( j = cur.length - 1; j >= 0; j-- ) {
						inst = $.data( cur[ j ], this.widgetFullName );
						if ( inst && inst !== this && !inst.options.disabled ) {
							queries.push( [ typeof inst.options.items === "function" ?
								inst.options.items.call( inst.element ) :
								$( inst.options.items, inst.element )
								.not( ".ui-sortable-helper" )
								.not( ".ui-sortable-placeholder" ), inst ] );
						}
					}
				}
			}

			queries.push( [ typeof this.options.items === "function" ?
				this.options.items
				.call( this.element, null, { options: this.options, item: this.currentItem } ) :
				$( this.options.items, this.element )
				.not( ".ui-sortable-helper" )
				.not( ".ui-sortable-placeholder" ), this ] );

			function addItems() {
				items.push( this );
			}
			for ( i = queries.length - 1; i >= 0; i-- ) {
				queries[ i ][ 0 ].each( addItems );
			}

			return $( items );

		},

		_removeCurrentsFromItems: function() {

			var list = this.currentItem.find( ":data(" + this.widgetName + "-item)" );

			this.items = $.grep( this.items, function( item ) {
				for ( var j = 0; j < list.length; j++ ) {
					if ( list[ j ] === item.item[ 0 ] ) {
						return false;
					}
				}
				return true;
			} );

		},

		_refreshItems: function( event ) {

			this.items = [];
			this.containers = [ this ];

			var i, j, cur, inst, targetData, _queries, item, queriesLength,
				items = this.items,
				queries = [ [ typeof this.options.items === "function" ?
					this.options.items.call( this.element[ 0 ], event, { item: this.currentItem } ) :
					$( this.options.items, this.element ), this ] ],
				connectWith = this._connectWith();

			//Shouldn't be run the first time through due to massive slow-down
			if ( connectWith && this.ready ) {
				for ( i = connectWith.length - 1; i >= 0; i-- ) {
					cur = $( connectWith[ i ], this.document[ 0 ] );
					for ( j = cur.length - 1; j >= 0; j-- ) {
						inst = $.data( cur[ j ], this.widgetFullName );
						if ( inst && inst !== this && !inst.options.disabled ) {
							queries.push( [ typeof inst.options.items === "function" ?
								inst.options.items
								.call( inst.element[ 0 ], event, { item: this.currentItem } ) :
								$( inst.options.items, inst.element ), inst ] );
							this.containers.push( inst );
						}
					}
				}
			}

			for ( i = queries.length - 1; i >= 0; i-- ) {
				targetData = queries[ i ][ 1 ];
				_queries = queries[ i ][ 0 ];

				for ( j = 0, queriesLength = _queries.length; j < queriesLength; j++ ) {
					item = $( _queries[ j ] );

					// Data for target checking (mouse manager)
					item.data( this.widgetName + "-item", targetData );

					items.push( {
						item: item,
						instance: targetData,
						width: 0, height: 0,
						left: 0, top: 0
					} );
				}
			}

		},

		_refreshItemPositions: function( fast ) {
			var i, item, t, p;

			for ( i = this.items.length - 1; i >= 0; i-- ) {
				item = this.items[ i ];

				//We ignore calculating positions of all connected containers when we're not over them
				if ( this.currentContainer && item.instance !== this.currentContainer &&
					item.item[ 0 ] !== this.currentItem[ 0 ] ) {
					continue;
				}

				t = this.options.toleranceElement ?
					$( this.options.toleranceElement, item.item ) :
					item.item;

				if ( !fast ) {
					item.width = t.outerWidth();
					item.height = t.outerHeight();
				}

				p = t.offset();
				item.left = p.left;
				item.top = p.top;
			}
		},

		refreshPositions: function( fast ) {

			// Determine whether items are being displayed horizontally
			this.floating = this.items.length ?
				this.options.axis === "x" || this._isFloating( this.items[ 0 ].item ) :
				false;

			if ( this.innermostContainer !== null ) {
				this._refreshItemPositions( fast );
			}

			var i, p;

			if ( this.options.custom && this.options.custom.refreshContainers ) {
				this.options.custom.refreshContainers.call( this );
			} else {
				for ( i = this.containers.length - 1; i >= 0; i-- ) {
					p = this.containers[ i ].element.offset();
					this.containers[ i ].containerCache.left = p.left;
					this.containers[ i ].containerCache.top = p.top;
					this.containers[ i ].containerCache.width =
						this.containers[ i ].element.outerWidth();
					this.containers[ i ].containerCache.height =
						this.containers[ i ].element.outerHeight();
				}
			}

			return this;
		},

		_createPlaceholder: function( that ) {
			that = that || this;
			var className, nodeName,
				o = that.options;

			if ( !o.placeholder || o.placeholder.constructor === String ) {
				className = o.placeholder;
				nodeName = that.currentItem[ 0 ].nodeName.toLowerCase();
				o.placeholder = {
					element: function() {

						var element = $( "<" + nodeName + ">", that.document[ 0 ] );

						that._addClass( element, "ui-sortable-placeholder",
							className || that.currentItem[ 0 ].className )
						._removeClass( element, "ui-sortable-helper" );

						if ( nodeName === "tbody" ) {
							that._createTrPlaceholder(
								that.currentItem.find( "tr" ).eq( 0 ),
								$( "<tr>", that.document[ 0 ] ).appendTo( element )
							);
						} else if ( nodeName === "tr" ) {
							that._createTrPlaceholder( that.currentItem, element );
						} else if ( nodeName === "img" ) {
							element.attr( "src", that.currentItem.attr( "src" ) );
						}

						if ( !className ) {
							element.css( "visibility", "hidden" );
						}

						return element;
					},
					update: function( container, p ) {

						// 1. If a className is set as 'placeholder option, we don't force sizes -
						// the class is responsible for that
						// 2. The option 'forcePlaceholderSize can be enabled to force it even if a
						// class name is specified
						if ( className && !o.forcePlaceholderSize ) {
							return;
						}

						// If the element doesn't have a actual height or width by itself (without
						// styles coming from a stylesheet), it receives the inline height and width
						// from the dragged item. Or, if it's a tbody or tr, it's going to have a height
						// anyway since we're populating them with <td>s above, but they're unlikely to
						// be the correct height on their own if the row heights are dynamic, so we'll
						// always assign the height of the dragged item given forcePlaceholderSize
						// is true.
						if ( !p.height() || ( o.forcePlaceholderSize &&
							( nodeName === "tbody" || nodeName === "tr" ) ) ) {
							p.height(
								that.currentItem.innerHeight() -
								parseInt( that.currentItem.css( "paddingTop" ) || 0, 10 ) -
								parseInt( that.currentItem.css( "paddingBottom" ) || 0, 10 ) );
						}
						if ( !p.width() ) {
							p.width(
								that.currentItem.innerWidth() -
								parseInt( that.currentItem.css( "paddingLeft" ) || 0, 10 ) -
								parseInt( that.currentItem.css( "paddingRight" ) || 0, 10 ) );
						}
					}
				};
			}

			//Create the placeholder
			that.placeholder = $( o.placeholder.element.call( that.element, that.currentItem ) );

			//Append it after the actual current item
			that.currentItem.after( that.placeholder );

			//Update the size of the placeholder (TODO: Logic to fuzzy, see line 316/317)
			o.placeholder.update( that, that.placeholder );

		},

		_createTrPlaceholder: function( sourceTr, targetTr ) {
			var that = this;

			sourceTr.children().each( function() {
				$( "<td>&#160;</td>", that.document[ 0 ] )
				.attr( "colspan", $( this ).attr( "colspan" ) || 1 )
				.appendTo( targetTr );
			} );
		},

		_contactContainers: function( event ) {
			var i, j, dist, itemWithLeastDistance, posProperty, sizeProperty, cur, nearBottom,
				floating, axis,
				innermostContainer = null,
				innermostIndex = null;

			// Get innermost container that intersects with item
			for ( i = this.containers.length - 1; i >= 0; i-- ) {

				// Never consider a container that's located within the item itself
				if ( $.contains( this.currentItem[ 0 ], this.containers[ i ].element[ 0 ] ) ) {
					continue;
				}

				if ( this._intersectsWith( this.containers[ i ].containerCache ) ) {

					// If we've already found a container and it's more "inner" than this, then continue
					if ( innermostContainer &&
						$.contains(
							this.containers[ i ].element[ 0 ],
							innermostContainer.element[ 0 ] ) ) {
						continue;
					}

					innermostContainer = this.containers[ i ];
					innermostIndex = i;

				} else {

					// container doesn't intersect. trigger "out" event if necessary
					if ( this.containers[ i ].containerCache.over ) {
						this.containers[ i ]._trigger( "out", event, this._uiHash( this ) );
						this.containers[ i ].containerCache.over = 0;
					}
				}

			}

			this.innermostContainer = innermostContainer;

			// If no intersecting containers found, return
			if ( !innermostContainer ) {
				return;
			}

			// Move the item into the container if it's not there already
			if ( this.containers.length === 1 ) {
				if ( !this.containers[ innermostIndex ].containerCache.over ) {
					this.containers[ innermostIndex ]._trigger( "over", event, this._uiHash( this ) );
					this.containers[ innermostIndex ].containerCache.over = 1;
				}
			} else {

				// When entering a new container, we will find the item with the least distance and
				// append our item near it
				dist = 10000;
				itemWithLeastDistance = null;
				floating = innermostContainer.floating || this._isFloating( this.currentItem );
				posProperty = floating ? "left" : "top";
				sizeProperty = floating ? "width" : "height";
				axis = floating ? "pageX" : "pageY";

				for ( j = this.items.length - 1; j >= 0; j-- ) {
					if ( !$.contains(
						this.containers[ innermostIndex ].element[ 0 ], this.items[ j ].item[ 0 ] )
					) {
						continue;
					}
					if ( this.items[ j ].item[ 0 ] === this.currentItem[ 0 ] ) {
						continue;
					}

					cur = this.items[ j ].item.offset()[ posProperty ];
					nearBottom = false;
					if ( event[ axis ] - cur > this.items[ j ][ sizeProperty ] / 2 ) {
						nearBottom = true;
					}

					if ( Math.abs( event[ axis ] - cur ) < dist ) {
						dist = Math.abs( event[ axis ] - cur );
						itemWithLeastDistance = this.items[ j ];
						this.direction = nearBottom ? "up" : "down";
					}
				}

				//Check if dropOnEmpty is enabled
				if ( !itemWithLeastDistance && !this.options.dropOnEmpty ) {
					return;
				}

				if ( this.currentContainer === this.containers[ innermostIndex ] ) {
					if ( !this.currentContainer.containerCache.over ) {
						this.containers[ innermostIndex ]._trigger( "over", event, this._uiHash() );
						this.currentContainer.containerCache.over = 1;
					}
					return;
				}

				if ( itemWithLeastDistance ) {
					this._rearrange( event, itemWithLeastDistance, null, true );
				} else {
					this._rearrange( event, null, this.containers[ innermostIndex ].element, true );
				}
				this._trigger( "change", event, this._uiHash() );
				this.containers[ innermostIndex ]._trigger( "change", event, this._uiHash( this ) );
				this.currentContainer = this.containers[ innermostIndex ];

				//Update the placeholder
				this.options.placeholder.update( this.currentContainer, this.placeholder );

				//Update scrollParent
				this.scrollParent = this.placeholder.scrollParent();

				//Update overflowOffset
				if ( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
					this.scrollParent[ 0 ].tagName !== "HTML" ) {
					this.overflowOffset = this.scrollParent.offset();
				}

				this.containers[ innermostIndex ]._trigger( "over", event, this._uiHash( this ) );
				this.containers[ innermostIndex ].containerCache.over = 1;
			}

		},

		_createHelper: function( event ) {

			var o = this.options,
				helper = typeof o.helper === "function" ?
					$( o.helper.apply( this.element[ 0 ], [ event, this.currentItem ] ) ) :
					( o.helper === "clone" ? this.currentItem.clone() : this.currentItem );

			//Add the helper to the DOM if that didn't happen already
			if ( !helper.parents( "body" ).length ) {
				this.appendTo[ 0 ].appendChild( helper[ 0 ] );
			}

			if ( helper[ 0 ] === this.currentItem[ 0 ] ) {
				this._storedCSS = {
					width: this.currentItem[ 0 ].style.width,
					height: this.currentItem[ 0 ].style.height,
					position: this.currentItem.css( "position" ),
					top: this.currentItem.css( "top" ),
					left: this.currentItem.css( "left" )
				};
			}

			if ( !helper[ 0 ].style.width || o.forceHelperSize ) {
				helper.width( this.currentItem.width() );
			}
			if ( !helper[ 0 ].style.height || o.forceHelperSize ) {
				helper.height( this.currentItem.height() );
			}

			return helper;

		},

		_adjustOffsetFromHelper: function( obj ) {
			if ( typeof obj === "string" ) {
				obj = obj.split( " " );
			}
			if ( Array.isArray( obj ) ) {
				obj = { left: +obj[ 0 ], top: +obj[ 1 ] || 0 };
			}
			if ( "left" in obj ) {
				this.offset.click.left = obj.left + this.margins.left;
			}
			if ( "right" in obj ) {
				this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
			}
			if ( "top" in obj ) {
				this.offset.click.top = obj.top + this.margins.top;
			}
			if ( "bottom" in obj ) {
				this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
			}
		},

		_getParentOffset: function() {

			//Get the offsetParent and cache its position
			this.offsetParent = this.helper.offsetParent();
			var po = this.offsetParent.offset();

			// This is a special case where we need to modify a offset calculated on start, since the
			// following happened:
			// 1. The position of the helper is absolute, so it's position is calculated based on the
			// next positioned parent
			// 2. The actual offset parent is a child of the scroll parent, and the scroll parent isn't
			// the document, which means that the scroll is included in the initial calculation of the
			// offset of the parent, and never recalculated upon drag
			if ( this.cssPosition === "absolute" && this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				$.contains( this.scrollParent[ 0 ], this.offsetParent[ 0 ] ) ) {
				po.left += this.scrollParent.scrollLeft();
				po.top += this.scrollParent.scrollTop();
			}

			// This needs to be actually done for all browsers, since pageX/pageY includes this
			// information with an ugly IE fix
			if ( this.offsetParent[ 0 ] === this.document[ 0 ].body ||
				( this.offsetParent[ 0 ].tagName &&
					this.offsetParent[ 0 ].tagName.toLowerCase() === "html" && $.ui.ie ) ) {
				po = { top: 0, left: 0 };
			}

			return {
				top: po.top + ( parseInt( this.offsetParent.css( "borderTopWidth" ), 10 ) || 0 ),
				left: po.left + ( parseInt( this.offsetParent.css( "borderLeftWidth" ), 10 ) || 0 )
			};

		},

		_getRelativeOffset: function() {

			if ( this.cssPosition === "relative" ) {
				var p = this.currentItem.position();
				return {
					top: p.top - ( parseInt( this.helper.css( "top" ), 10 ) || 0 ) +
						this.scrollParent.scrollTop(),
					left: p.left - ( parseInt( this.helper.css( "left" ), 10 ) || 0 ) +
						this.scrollParent.scrollLeft()
				};
			} else {
				return { top: 0, left: 0 };
			}

		},

		_cacheMargins: function() {
			this.margins = {
				left: ( parseInt( this.currentItem.css( "marginLeft" ), 10 ) || 0 ),
				top: ( parseInt( this.currentItem.css( "marginTop" ), 10 ) || 0 )
			};
		},

		_cacheHelperProportions: function() {
			this.helperProportions = {
				width: this.helper.outerWidth(),
				height: this.helper.outerHeight()
			};
		},

		_setContainment: function() {

			var ce, co, over,
				o = this.options;
			if ( o.containment === "parent" ) {
				o.containment = this.helper[ 0 ].parentNode;
			}
			if ( o.containment === "document" || o.containment === "window" ) {
				this.containment = [
					0 - this.offset.relative.left - this.offset.parent.left,
					0 - this.offset.relative.top - this.offset.parent.top,
					o.containment === "document" ?
						this.document.width() :
						this.window.width() - this.helperProportions.width - this.margins.left,
					( o.containment === "document" ?
							( this.document.height() || document.body.parentNode.scrollHeight ) :
							this.window.height() || this.document[ 0 ].body.parentNode.scrollHeight
					) - this.helperProportions.height - this.margins.top
				];
			}

			if ( !( /^(document|window|parent)$/ ).test( o.containment ) ) {
				ce = $( o.containment )[ 0 ];
				co = $( o.containment ).offset();
				over = ( $( ce ).css( "overflow" ) !== "hidden" );

				this.containment = [
					co.left + ( parseInt( $( ce ).css( "borderLeftWidth" ), 10 ) || 0 ) +
					( parseInt( $( ce ).css( "paddingLeft" ), 10 ) || 0 ) - this.margins.left,
					co.top + ( parseInt( $( ce ).css( "borderTopWidth" ), 10 ) || 0 ) +
					( parseInt( $( ce ).css( "paddingTop" ), 10 ) || 0 ) - this.margins.top,
					co.left + ( over ? Math.max( ce.scrollWidth, ce.offsetWidth ) : ce.offsetWidth ) -
					( parseInt( $( ce ).css( "borderLeftWidth" ), 10 ) || 0 ) -
					( parseInt( $( ce ).css( "paddingRight" ), 10 ) || 0 ) -
					this.helperProportions.width - this.margins.left,
					co.top + ( over ? Math.max( ce.scrollHeight, ce.offsetHeight ) : ce.offsetHeight ) -
					( parseInt( $( ce ).css( "borderTopWidth" ), 10 ) || 0 ) -
					( parseInt( $( ce ).css( "paddingBottom" ), 10 ) || 0 ) -
					this.helperProportions.height - this.margins.top
				];
			}

		},

		_convertPositionTo: function( d, pos ) {

			if ( !pos ) {
				pos = this.position;
			}
			var mod = d === "absolute" ? 1 : -1,
				scroll = this.cssPosition === "absolute" &&
				!( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
					$.contains( this.scrollParent[ 0 ], this.offsetParent[ 0 ] ) ) ?
					this.offsetParent :
					this.scrollParent,
				scrollIsRootNode = ( /(html|body)/i ).test( scroll[ 0 ].tagName );

			return {
				top: (

					// The absolute mouse position
					pos.top	+

					// Only for relative positioned nodes: Relative offset from element to offset parent
					this.offset.relative.top * mod +

					// The offsetParent's offset without borders (offset + border)
					this.offset.parent.top * mod -
					( ( this.cssPosition === "fixed" ?
						-this.scrollParent.scrollTop() :
						( scrollIsRootNode ? 0 : scroll.scrollTop() ) ) * mod )
				),
				left: (

					// The absolute mouse position
					pos.left +

					// Only for relative positioned nodes: Relative offset from element to offset parent
					this.offset.relative.left * mod +

					// The offsetParent's offset without borders (offset + border)
					this.offset.parent.left * mod	-
					( ( this.cssPosition === "fixed" ?
						-this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 :
							scroll.scrollLeft() ) * mod )
				)
			};

		},

		_generatePosition: function( event ) {

			var top, left,
				o = this.options,
				pageX = event.pageX,
				pageY = event.pageY,
				scroll = this.cssPosition === "absolute" &&
				!( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
					$.contains( this.scrollParent[ 0 ], this.offsetParent[ 0 ] ) ) ?
					this.offsetParent :
					this.scrollParent,
				scrollIsRootNode = ( /(html|body)/i ).test( scroll[ 0 ].tagName );

			// This is another very weird special case that only happens for relative elements:
			// 1. If the css position is relative
			// 2. and the scroll parent is the document or similar to the offset parent
			// we have to refresh the relative offset during the scroll so there are no jumps
			if ( this.cssPosition === "relative" && !( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				this.scrollParent[ 0 ] !== this.offsetParent[ 0 ] ) ) {
				this.offset.relative = this._getRelativeOffset();
			}

			/*
		 * - Position constraining -
		 * Constrain the position to a mix of grid, containment.
		 */

			if ( this.originalPosition ) { //If we are not dragging yet, we won't check for options

				if ( this.containment ) {
					if ( event.pageX - this.offset.click.left < this.containment[ 0 ] ) {
						pageX = this.containment[ 0 ] + this.offset.click.left;
					}
					if ( event.pageY - this.offset.click.top < this.containment[ 1 ] ) {
						pageY = this.containment[ 1 ] + this.offset.click.top;
					}
					if ( event.pageX - this.offset.click.left > this.containment[ 2 ] ) {
						pageX = this.containment[ 2 ] + this.offset.click.left;
					}
					if ( event.pageY - this.offset.click.top > this.containment[ 3 ] ) {
						pageY = this.containment[ 3 ] + this.offset.click.top;
					}
				}

				if ( o.grid ) {
					top = this.originalPageY + Math.round( ( pageY - this.originalPageY ) /
						o.grid[ 1 ] ) * o.grid[ 1 ];
					pageY = this.containment ?
						( ( top - this.offset.click.top >= this.containment[ 1 ] &&
							top - this.offset.click.top <= this.containment[ 3 ] ) ?
							top :
							( ( top - this.offset.click.top >= this.containment[ 1 ] ) ?
								top - o.grid[ 1 ] : top + o.grid[ 1 ] ) ) :
						top;

					left = this.originalPageX + Math.round( ( pageX - this.originalPageX ) /
						o.grid[ 0 ] ) * o.grid[ 0 ];
					pageX = this.containment ?
						( ( left - this.offset.click.left >= this.containment[ 0 ] &&
							left - this.offset.click.left <= this.containment[ 2 ] ) ?
							left :
							( ( left - this.offset.click.left >= this.containment[ 0 ] ) ?
								left - o.grid[ 0 ] : left + o.grid[ 0 ] ) ) :
						left;
				}

			}

			return {
				top: (

					// The absolute mouse position
					pageY -

					// Click offset (relative to the element)
					this.offset.click.top -

					// Only for relative positioned nodes: Relative offset from element to offset parent
					this.offset.relative.top -

					// The offsetParent's offset without borders (offset + border)
					this.offset.parent.top +
					( ( this.cssPosition === "fixed" ?
						-this.scrollParent.scrollTop() :
						( scrollIsRootNode ? 0 : scroll.scrollTop() ) ) )
				),
				left: (

					// The absolute mouse position
					pageX -

					// Click offset (relative to the element)
					this.offset.click.left -

					// Only for relative positioned nodes: Relative offset from element to offset parent
					this.offset.relative.left -

					// The offsetParent's offset without borders (offset + border)
					this.offset.parent.left +
					( ( this.cssPosition === "fixed" ?
						-this.scrollParent.scrollLeft() :
						scrollIsRootNode ? 0 : scroll.scrollLeft() ) )
				)
			};

		},

		_rearrange: function( event, i, a, hardRefresh ) {

			if ( a ) {
				a[ 0 ].appendChild( this.placeholder[ 0 ] );
			} else {
				i.item[ 0 ].parentNode.insertBefore( this.placeholder[ 0 ],
					( this.direction === "down" ? i.item[ 0 ] : i.item[ 0 ].nextSibling ) );
			}

			//Various things done here to improve the performance:
			// 1. we create a setTimeout, that calls refreshPositions
			// 2. on the instance, we have a counter variable, that get's higher after every append
			// 3. on the local scope, we copy the counter variable, and check in the timeout,
			// if it's still the same
			// 4. this lets only the last addition to the timeout stack through
			this.counter = this.counter ? ++this.counter : 1;
			var counter = this.counter;

			this._delay( function() {
				if ( counter === this.counter ) {

					//Precompute after each DOM insertion, NOT on mousemove
					this.refreshPositions( !hardRefresh );
				}
			} );

		},

		_clear: function( event, noPropagation ) {

			this.reverting = false;

			// We delay all events that have to be triggered to after the point where the placeholder
			// has been removed and everything else normalized again
			var i,
				delayedTriggers = [];

			// We first have to update the dom position of the actual currentItem
			// Note: don't do it if the current item is already removed (by a user), or it gets
			// reappended (see #4088)
			if ( !this._noFinalSort && this.currentItem.parent().length ) {
				this.placeholder.before( this.currentItem );
			}
			this._noFinalSort = null;

			if ( this.helper[ 0 ] === this.currentItem[ 0 ] ) {
				for ( i in this._storedCSS ) {
					if ( this._storedCSS[ i ] === "auto" || this._storedCSS[ i ] === "static" ) {
						this._storedCSS[ i ] = "";
					}
				}
				this.currentItem.css( this._storedCSS );
				this._removeClass( this.currentItem, "ui-sortable-helper" );
			} else {
				this.currentItem.show();
			}

			if ( this.fromOutside && !noPropagation ) {
				delayedTriggers.push( function( event ) {
					this._trigger( "receive", event, this._uiHash( this.fromOutside ) );
				} );
			}
			if ( ( this.fromOutside ||
				this.domPosition.prev !==
				this.currentItem.prev().not( ".ui-sortable-helper" )[ 0 ] ||
				this.domPosition.parent !== this.currentItem.parent()[ 0 ] ) && !noPropagation ) {

				// Trigger update callback if the DOM position has changed
				delayedTriggers.push( function( event ) {
					this._trigger( "update", event, this._uiHash() );
				} );
			}

			// Check if the items Container has Changed and trigger appropriate
			// events.
			if ( this !== this.currentContainer ) {
				if ( !noPropagation ) {
					delayedTriggers.push( function( event ) {
						this._trigger( "remove", event, this._uiHash() );
					} );
					delayedTriggers.push( ( function( c ) {
						return function( event ) {
							c._trigger( "receive", event, this._uiHash( this ) );
						};
					} ).call( this, this.currentContainer ) );
					delayedTriggers.push( ( function( c ) {
						return function( event ) {
							c._trigger( "update", event, this._uiHash( this ) );
						};
					} ).call( this, this.currentContainer ) );
				}
			}

			//Post events to containers
			function delayEvent( type, instance, container ) {
				return function( event ) {
					container._trigger( type, event, instance._uiHash( instance ) );
				};
			}
			for ( i = this.containers.length - 1; i >= 0; i-- ) {
				if ( !noPropagation ) {
					delayedTriggers.push( delayEvent( "deactivate", this, this.containers[ i ] ) );
				}
				if ( this.containers[ i ].containerCache.over ) {
					delayedTriggers.push( delayEvent( "out", this, this.containers[ i ] ) );
					this.containers[ i ].containerCache.over = 0;
				}
			}

			//Do what was originally in plugins
			if ( this.storedCursor ) {
				this.document.find( "body" ).css( "cursor", this.storedCursor );
				this.storedStylesheet.remove();
			}
			if ( this._storedOpacity ) {
				this.helper.css( "opacity", this._storedOpacity );
			}
			if ( this._storedZIndex ) {
				this.helper.css( "zIndex", this._storedZIndex === "auto" ? "" : this._storedZIndex );
			}

			this.dragging = false;

			if ( !noPropagation ) {
				this._trigger( "beforeStop", event, this._uiHash() );
			}

			//$(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately,
			// it unbinds ALL events from the original node!
			this.placeholder[ 0 ].parentNode.removeChild( this.placeholder[ 0 ] );

			if ( !this.cancelHelperRemoval ) {
				if ( this.helper[ 0 ] !== this.currentItem[ 0 ] ) {
					this.helper.remove();
				}
				this.helper = null;
			}

			if ( !noPropagation ) {
				for ( i = 0; i < delayedTriggers.length; i++ ) {

					// Trigger all delayed events
					delayedTriggers[ i ].call( this, event );
				}
				this._trigger( "stop", event, this._uiHash() );
			}

			this.fromOutside = false;
			return !this.cancelHelperRemoval;

		},

		_trigger: function() {
			if ( $.Widget.prototype._trigger.apply( this, arguments ) === false ) {
				this.cancel();
			}
		},

		_uiHash: function( _inst ) {
			var inst = _inst || this;
			return {
				helper: inst.helper,
				placeholder: inst.placeholder || $( [] ),
				position: inst.position,
				originalPosition: inst.originalPosition,
				offset: inst.positionAbs,
				item: inst.currentItem,
				sender: _inst ? _inst.element : null
			};
		}

	} );


	/*!
 * jQuery UI Spinner 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Spinner
//>>group: Widgets
//>>description: Displays buttons to easily input numbers via the keyboard or mouse.
//>>docs: http://api.jqueryui.com/spinner/
//>>demos: http://jqueryui.com/spinner/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/spinner.css
//>>css.theme: ../../themes/base/theme.css


	function spinnerModifier( fn ) {
		return function() {
			var previous = this.element.val();
			fn.apply( this, arguments );
			this._refresh();
			if ( previous !== this.element.val() ) {
				this._trigger( "change" );
			}
		};
	}

	$.widget( "ui.spinner", {
		version: "1.13.0",
		defaultElement: "<input>",
		widgetEventPrefix: "spin",
		options: {
			classes: {
				"ui-spinner": "ui-corner-all",
				"ui-spinner-down": "ui-corner-br",
				"ui-spinner-up": "ui-corner-tr"
			},
			culture: null,
			icons: {
				down: "ui-icon-triangle-1-s",
				up: "ui-icon-triangle-1-n"
			},
			incremental: true,
			max: null,
			min: null,
			numberFormat: null,
			page: 10,
			step: 1,

			change: null,
			spin: null,
			start: null,
			stop: null
		},

		_create: function() {

			// handle string values that need to be parsed
			this._setOption( "max", this.options.max );
			this._setOption( "min", this.options.min );
			this._setOption( "step", this.options.step );

			// Only format if there is a value, prevents the field from being marked
			// as invalid in Firefox, see #9573.
			if ( this.value() !== "" ) {

				// Format the value, but don't constrain.
				this._value( this.element.val(), true );
			}

			this._draw();
			this._on( this._events );
			this._refresh();

			// Turning off autocomplete prevents the browser from remembering the
			// value when navigating through history, so we re-enable autocomplete
			// if the page is unloaded before the widget is destroyed. #7790
			this._on( this.window, {
				beforeunload: function() {
					this.element.removeAttr( "autocomplete" );
				}
			} );
		},

		_getCreateOptions: function() {
			var options = this._super();
			var element = this.element;

			$.each( [ "min", "max", "step" ], function( i, option ) {
				var value = element.attr( option );
				if ( value != null && value.length ) {
					options[ option ] = value;
				}
			} );

			return options;
		},

		_events: {
			keydown: function( event ) {
				if ( this._start( event ) && this._keydown( event ) ) {
					event.preventDefault();
				}
			},
			keyup: "_stop",
			focus: function() {
				this.previous = this.element.val();
			},
			blur: function( event ) {
				if ( this.cancelBlur ) {
					delete this.cancelBlur;
					return;
				}

				this._stop();
				this._refresh();
				if ( this.previous !== this.element.val() ) {
					this._trigger( "change", event );
				}
			},
			mousewheel: function( event, delta ) {
				var activeElement = $.ui.safeActiveElement( this.document[ 0 ] );
				var isActive = this.element[ 0 ] === activeElement;

				if ( !isActive || !delta ) {
					return;
				}

				if ( !this.spinning && !this._start( event ) ) {
					return false;
				}

				this._spin( ( delta > 0 ? 1 : -1 ) * this.options.step, event );
				clearTimeout( this.mousewheelTimer );
				this.mousewheelTimer = this._delay( function() {
					if ( this.spinning ) {
						this._stop( event );
					}
				}, 100 );
				event.preventDefault();
			},
			"mousedown .ui-spinner-button": function( event ) {
				var previous;

				// We never want the buttons to have focus; whenever the user is
				// interacting with the spinner, the focus should be on the input.
				// If the input is focused then this.previous is properly set from
				// when the input first received focus. If the input is not focused
				// then we need to set this.previous based on the value before spinning.
				previous = this.element[ 0 ] === $.ui.safeActiveElement( this.document[ 0 ] ) ?
					this.previous : this.element.val();
				function checkFocus() {
					var isActive = this.element[ 0 ] === $.ui.safeActiveElement( this.document[ 0 ] );
					if ( !isActive ) {
						this.element.trigger( "focus" );
						this.previous = previous;

						// support: IE
						// IE sets focus asynchronously, so we need to check if focus
						// moved off of the input because the user clicked on the button.
						this._delay( function() {
							this.previous = previous;
						} );
					}
				}

				// Ensure focus is on (or stays on) the text field
				event.preventDefault();
				checkFocus.call( this );

				// Support: IE
				// IE doesn't prevent moving focus even with event.preventDefault()
				// so we set a flag to know when we should ignore the blur event
				// and check (again) if focus moved off of the input.
				this.cancelBlur = true;
				this._delay( function() {
					delete this.cancelBlur;
					checkFocus.call( this );
				} );

				if ( this._start( event ) === false ) {
					return;
				}

				this._repeat( null, $( event.currentTarget )
				.hasClass( "ui-spinner-up" ) ? 1 : -1, event );
			},
			"mouseup .ui-spinner-button": "_stop",
			"mouseenter .ui-spinner-button": function( event ) {

				// button will add ui-state-active if mouse was down while mouseleave and kept down
				if ( !$( event.currentTarget ).hasClass( "ui-state-active" ) ) {
					return;
				}

				if ( this._start( event ) === false ) {
					return false;
				}
				this._repeat( null, $( event.currentTarget )
				.hasClass( "ui-spinner-up" ) ? 1 : -1, event );
			},

			// TODO: do we really want to consider this a stop?
			// shouldn't we just stop the repeater and wait until mouseup before
			// we trigger the stop event?
			"mouseleave .ui-spinner-button": "_stop"
		},

		// Support mobile enhanced option and make backcompat more sane
		_enhance: function() {
			this.uiSpinner = this.element
			.attr( "autocomplete", "off" )
			.wrap( "<span>" )
			.parent()

			// Add buttons
			.append(
				"<a></a><a></a>"
			);
		},

		_draw: function() {
			this._enhance();

			this._addClass( this.uiSpinner, "ui-spinner", "ui-widget ui-widget-content" );
			this._addClass( "ui-spinner-input" );

			this.element.attr( "role", "spinbutton" );

			// Button bindings
			this.buttons = this.uiSpinner.children( "a" )
			.attr( "tabIndex", -1 )
			.attr( "aria-hidden", true )
			.button( {
				classes: {
					"ui-button": ""
				}
			} );

			// TODO: Right now button does not support classes this is already updated in button PR
			this._removeClass( this.buttons, "ui-corner-all" );

			this._addClass( this.buttons.first(), "ui-spinner-button ui-spinner-up" );
			this._addClass( this.buttons.last(), "ui-spinner-button ui-spinner-down" );
			this.buttons.first().button( {
				"icon": this.options.icons.up,
				"showLabel": false
			} );
			this.buttons.last().button( {
				"icon": this.options.icons.down,
				"showLabel": false
			} );

			// IE 6 doesn't understand height: 50% for the buttons
			// unless the wrapper has an explicit height
			if ( this.buttons.height() > Math.ceil( this.uiSpinner.height() * 0.5 ) &&
				this.uiSpinner.height() > 0 ) {
				this.uiSpinner.height( this.uiSpinner.height() );
			}
		},

		_keydown: function( event ) {
			var options = this.options,
				keyCode = $.ui.keyCode;

			switch ( event.keyCode ) {
				case keyCode.UP:
					this._repeat( null, 1, event );
					return true;
				case keyCode.DOWN:
					this._repeat( null, -1, event );
					return true;
				case keyCode.PAGE_UP:
					this._repeat( null, options.page, event );
					return true;
				case keyCode.PAGE_DOWN:
					this._repeat( null, -options.page, event );
					return true;
			}

			return false;
		},

		_start: function( event ) {
			if ( !this.spinning && this._trigger( "start", event ) === false ) {
				return false;
			}

			if ( !this.counter ) {
				this.counter = 1;
			}
			this.spinning = true;
			return true;
		},

		_repeat: function( i, steps, event ) {
			i = i || 500;

			clearTimeout( this.timer );
			this.timer = this._delay( function() {
				this._repeat( 40, steps, event );
			}, i );

			this._spin( steps * this.options.step, event );
		},

		_spin: function( step, event ) {
			var value = this.value() || 0;

			if ( !this.counter ) {
				this.counter = 1;
			}

			value = this._adjustValue( value + step * this._increment( this.counter ) );

			if ( !this.spinning || this._trigger( "spin", event, { value: value } ) !== false ) {
				this._value( value );
				this.counter++;
			}
		},

		_increment: function( i ) {
			var incremental = this.options.incremental;

			if ( incremental ) {
				return typeof incremental === "function" ?
					incremental( i ) :
					Math.floor( i * i * i / 50000 - i * i / 500 + 17 * i / 200 + 1 );
			}

			return 1;
		},

		_precision: function() {
			var precision = this._precisionOf( this.options.step );
			if ( this.options.min !== null ) {
				precision = Math.max( precision, this._precisionOf( this.options.min ) );
			}
			return precision;
		},

		_precisionOf: function( num ) {
			var str = num.toString(),
				decimal = str.indexOf( "." );
			return decimal === -1 ? 0 : str.length - decimal - 1;
		},

		_adjustValue: function( value ) {
			var base, aboveMin,
				options = this.options;

			// Make sure we're at a valid step
			// - find out where we are relative to the base (min or 0)
			base = options.min !== null ? options.min : 0;
			aboveMin = value - base;

			// - round to the nearest step
			aboveMin = Math.round( aboveMin / options.step ) * options.step;

			// - rounding is based on 0, so adjust back to our base
			value = base + aboveMin;

			// Fix precision from bad JS floating point math
			value = parseFloat( value.toFixed( this._precision() ) );

			// Clamp the value
			if ( options.max !== null && value > options.max ) {
				return options.max;
			}
			if ( options.min !== null && value < options.min ) {
				return options.min;
			}

			return value;
		},

		_stop: function( event ) {
			if ( !this.spinning ) {
				return;
			}

			clearTimeout( this.timer );
			clearTimeout( this.mousewheelTimer );
			this.counter = 0;
			this.spinning = false;
			this._trigger( "stop", event );
		},

		_setOption: function( key, value ) {
			var prevValue, first, last;

			if ( key === "culture" || key === "numberFormat" ) {
				prevValue = this._parse( this.element.val() );
				this.options[ key ] = value;
				this.element.val( this._format( prevValue ) );
				return;
			}

			if ( key === "max" || key === "min" || key === "step" ) {
				if ( typeof value === "string" ) {
					value = this._parse( value );
				}
			}
			if ( key === "icons" ) {
				first = this.buttons.first().find( ".ui-icon" );
				this._removeClass( first, null, this.options.icons.up );
				this._addClass( first, null, value.up );
				last = this.buttons.last().find( ".ui-icon" );
				this._removeClass( last, null, this.options.icons.down );
				this._addClass( last, null, value.down );
			}

			this._super( key, value );
		},

		_setOptionDisabled: function( value ) {
			this._super( value );

			this._toggleClass( this.uiSpinner, null, "ui-state-disabled", !!value );
			this.element.prop( "disabled", !!value );
			this.buttons.button( value ? "disable" : "enable" );
		},

		_setOptions: spinnerModifier( function( options ) {
			this._super( options );
		} ),

		_parse: function( val ) {
			if ( typeof val === "string" && val !== "" ) {
				val = window.Globalize && this.options.numberFormat ?
					Globalize.parseFloat( val, 10, this.options.culture ) : +val;
			}
			return val === "" || isNaN( val ) ? null : val;
		},

		_format: function( value ) {
			if ( value === "" ) {
				return "";
			}
			return window.Globalize && this.options.numberFormat ?
				Globalize.format( value, this.options.numberFormat, this.options.culture ) :
				value;
		},

		_refresh: function() {
			this.element.attr( {
				"aria-valuemin": this.options.min,
				"aria-valuemax": this.options.max,

				// TODO: what should we do with values that can't be parsed?
				"aria-valuenow": this._parse( this.element.val() )
			} );
		},

		isValid: function() {
			var value = this.value();

			// Null is invalid
			if ( value === null ) {
				return false;
			}

			// If value gets adjusted, it's invalid
			return value === this._adjustValue( value );
		},

		// Update the value without triggering change
		_value: function( value, allowAny ) {
			var parsed;
			if ( value !== "" ) {
				parsed = this._parse( value );
				if ( parsed !== null ) {
					if ( !allowAny ) {
						parsed = this._adjustValue( parsed );
					}
					value = this._format( parsed );
				}
			}
			this.element.val( value );
			this._refresh();
		},

		_destroy: function() {
			this.element
			.prop( "disabled", false )
			.removeAttr( "autocomplete role aria-valuemin aria-valuemax aria-valuenow" );

			this.uiSpinner.replaceWith( this.element );
		},

		stepUp: spinnerModifier( function( steps ) {
			this._stepUp( steps );
		} ),
		_stepUp: function( steps ) {
			if ( this._start() ) {
				this._spin( ( steps || 1 ) * this.options.step );
				this._stop();
			}
		},

		stepDown: spinnerModifier( function( steps ) {
			this._stepDown( steps );
		} ),
		_stepDown: function( steps ) {
			if ( this._start() ) {
				this._spin( ( steps || 1 ) * -this.options.step );
				this._stop();
			}
		},

		pageUp: spinnerModifier( function( pages ) {
			this._stepUp( ( pages || 1 ) * this.options.page );
		} ),

		pageDown: spinnerModifier( function( pages ) {
			this._stepDown( ( pages || 1 ) * this.options.page );
		} ),

		value: function( newVal ) {
			if ( !arguments.length ) {
				return this._parse( this.element.val() );
			}
			spinnerModifier( this._value ).call( this, newVal );
		},

		widget: function() {
			return this.uiSpinner;
		}
	} );

// DEPRECATED
// TODO: switch return back to widget declaration at top of file when this is removed
	if ( $.uiBackCompat !== false ) {

		// Backcompat for spinner html extension points
		$.widget( "ui.spinner", $.ui.spinner, {
			_enhance: function() {
				this.uiSpinner = this.element
				.attr( "autocomplete", "off" )
				.wrap( this._uiSpinnerHtml() )
				.parent()

				// Add buttons
				.append( this._buttonHtml() );
			},
			_uiSpinnerHtml: function() {
				return "<span>";
			},

			_buttonHtml: function() {
				return "<a></a><a></a>";
			}
		} );
	}

	var widgetsSpinner = $.ui.spinner;


	/*!
 * jQuery UI Tabs 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Tabs
//>>group: Widgets
//>>description: Transforms a set of container elements into a tab structure.
//>>docs: http://api.jqueryui.com/tabs/
//>>demos: http://jqueryui.com/tabs/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/tabs.css
//>>css.theme: ../../themes/base/theme.css


	$.widget( "ui.tabs", {
		version: "1.13.0",
		delay: 300,
		options: {
			active: null,
			classes: {
				"ui-tabs": "ui-corner-all",
				"ui-tabs-nav": "ui-corner-all",
				"ui-tabs-panel": "ui-corner-bottom",
				"ui-tabs-tab": "ui-corner-top"
			},
			collapsible: false,
			event: "click",
			heightStyle: "content",
			hide: null,
			show: null,

			// Callbacks
			activate: null,
			beforeActivate: null,
			beforeLoad: null,
			load: null
		},

		_isLocal: ( function() {
			var rhash = /#.*$/;

			return function( anchor ) {
				var anchorUrl, locationUrl;

				anchorUrl = anchor.href.replace( rhash, "" );
				locationUrl = location.href.replace( rhash, "" );

				// Decoding may throw an error if the URL isn't UTF-8 (#9518)
				try {
					anchorUrl = decodeURIComponent( anchorUrl );
				} catch ( error ) {}
				try {
					locationUrl = decodeURIComponent( locationUrl );
				} catch ( error ) {}

				return anchor.hash.length > 1 && anchorUrl === locationUrl;
			};
		} )(),

		_create: function() {
			var that = this,
				options = this.options;

			this.running = false;

			this._addClass( "ui-tabs", "ui-widget ui-widget-content" );
			this._toggleClass( "ui-tabs-collapsible", null, options.collapsible );

			this._processTabs();
			options.active = this._initialActive();

			// Take disabling tabs via class attribute from HTML
			// into account and update option properly.
			if ( Array.isArray( options.disabled ) ) {
				options.disabled = $.uniqueSort( options.disabled.concat(
					$.map( this.tabs.filter( ".ui-state-disabled" ), function( li ) {
						return that.tabs.index( li );
					} )
				) ).sort();
			}

			// Check for length avoids error when initializing empty list
			if ( this.options.active !== false && this.anchors.length ) {
				this.active = this._findActive( options.active );
			} else {
				this.active = $();
			}

			this._refresh();

			if ( this.active.length ) {
				this.load( options.active );
			}
		},

		_initialActive: function() {
			var active = this.options.active,
				collapsible = this.options.collapsible,
				locationHash = location.hash.substring( 1 );

			if ( active === null ) {

				// check the fragment identifier in the URL
				if ( locationHash ) {
					this.tabs.each( function( i, tab ) {
						if ( $( tab ).attr( "aria-controls" ) === locationHash ) {
							active = i;
							return false;
						}
					} );
				}

				// Check for a tab marked active via a class
				if ( active === null ) {
					active = this.tabs.index( this.tabs.filter( ".ui-tabs-active" ) );
				}

				// No active tab, set to false
				if ( active === null || active === -1 ) {
					active = this.tabs.length ? 0 : false;
				}
			}

			// Handle numbers: negative, out of range
			if ( active !== false ) {
				active = this.tabs.index( this.tabs.eq( active ) );
				if ( active === -1 ) {
					active = collapsible ? false : 0;
				}
			}

			// Don't allow collapsible: false and active: false
			if ( !collapsible && active === false && this.anchors.length ) {
				active = 0;
			}

			return active;
		},

		_getCreateEventData: function() {
			return {
				tab: this.active,
				panel: !this.active.length ? $() : this._getPanelForTab( this.active )
			};
		},

		_tabKeydown: function( event ) {
			var focusedTab = $( $.ui.safeActiveElement( this.document[ 0 ] ) ).closest( "li" ),
				selectedIndex = this.tabs.index( focusedTab ),
				goingForward = true;

			if ( this._handlePageNav( event ) ) {
				return;
			}

			switch ( event.keyCode ) {
				case $.ui.keyCode.RIGHT:
				case $.ui.keyCode.DOWN:
					selectedIndex++;
					break;
				case $.ui.keyCode.UP:
				case $.ui.keyCode.LEFT:
					goingForward = false;
					selectedIndex--;
					break;
				case $.ui.keyCode.END:
					selectedIndex = this.anchors.length - 1;
					break;
				case $.ui.keyCode.HOME:
					selectedIndex = 0;
					break;
				case $.ui.keyCode.SPACE:

					// Activate only, no collapsing
					event.preventDefault();
					clearTimeout( this.activating );
					this._activate( selectedIndex );
					return;
				case $.ui.keyCode.ENTER:

					// Toggle (cancel delayed activation, allow collapsing)
					event.preventDefault();
					clearTimeout( this.activating );

					// Determine if we should collapse or activate
					this._activate( selectedIndex === this.options.active ? false : selectedIndex );
					return;
				default:
					return;
			}

			// Focus the appropriate tab, based on which key was pressed
			event.preventDefault();
			clearTimeout( this.activating );
			selectedIndex = this._focusNextTab( selectedIndex, goingForward );

			// Navigating with control/command key will prevent automatic activation
			if ( !event.ctrlKey && !event.metaKey ) {

				// Update aria-selected immediately so that AT think the tab is already selected.
				// Otherwise AT may confuse the user by stating that they need to activate the tab,
				// but the tab will already be activated by the time the announcement finishes.
				focusedTab.attr( "aria-selected", "false" );
				this.tabs.eq( selectedIndex ).attr( "aria-selected", "true" );

				this.activating = this._delay( function() {
					this.option( "active", selectedIndex );
				}, this.delay );
			}
		},

		_panelKeydown: function( event ) {
			if ( this._handlePageNav( event ) ) {
				return;
			}

			// Ctrl+up moves focus to the current tab
			if ( event.ctrlKey && event.keyCode === $.ui.keyCode.UP ) {
				event.preventDefault();
				this.active.trigger( "focus" );
			}
		},

		// Alt+page up/down moves focus to the previous/next tab (and activates)
		_handlePageNav: function( event ) {
			if ( event.altKey && event.keyCode === $.ui.keyCode.PAGE_UP ) {
				this._activate( this._focusNextTab( this.options.active - 1, false ) );
				return true;
			}
			if ( event.altKey && event.keyCode === $.ui.keyCode.PAGE_DOWN ) {
				this._activate( this._focusNextTab( this.options.active + 1, true ) );
				return true;
			}
		},

		_findNextTab: function( index, goingForward ) {
			var lastTabIndex = this.tabs.length - 1;

			function constrain() {
				if ( index > lastTabIndex ) {
					index = 0;
				}
				if ( index < 0 ) {
					index = lastTabIndex;
				}
				return index;
			}

			while ( $.inArray( constrain(), this.options.disabled ) !== -1 ) {
				index = goingForward ? index + 1 : index - 1;
			}

			return index;
		},

		_focusNextTab: function( index, goingForward ) {
			index = this._findNextTab( index, goingForward );
			this.tabs.eq( index ).trigger( "focus" );
			return index;
		},

		_setOption: function( key, value ) {
			if ( key === "active" ) {

				// _activate() will handle invalid values and update this.options
				this._activate( value );
				return;
			}

			this._super( key, value );

			if ( key === "collapsible" ) {
				this._toggleClass( "ui-tabs-collapsible", null, value );

				// Setting collapsible: false while collapsed; open first panel
				if ( !value && this.options.active === false ) {
					this._activate( 0 );
				}
			}

			if ( key === "event" ) {
				this._setupEvents( value );
			}

			if ( key === "heightStyle" ) {
				this._setupHeightStyle( value );
			}
		},

		_sanitizeSelector: function( hash ) {
			return hash ? hash.replace( /[!"$%&'()*+,.\/:;<=>?@\[\]\^`{|}~]/g, "\\$&" ) : "";
		},

		refresh: function() {
			var options = this.options,
				lis = this.tablist.children( ":has(a[href])" );

			// Get disabled tabs from class attribute from HTML
			// this will get converted to a boolean if needed in _refresh()
			options.disabled = $.map( lis.filter( ".ui-state-disabled" ), function( tab ) {
				return lis.index( tab );
			} );

			this._processTabs();

			// Was collapsed or no tabs
			if ( options.active === false || !this.anchors.length ) {
				options.active = false;
				this.active = $();

				// was active, but active tab is gone
			} else if ( this.active.length && !$.contains( this.tablist[ 0 ], this.active[ 0 ] ) ) {

				// all remaining tabs are disabled
				if ( this.tabs.length === options.disabled.length ) {
					options.active = false;
					this.active = $();

					// activate previous tab
				} else {
					this._activate( this._findNextTab( Math.max( 0, options.active - 1 ), false ) );
				}

				// was active, active tab still exists
			} else {

				// make sure active index is correct
				options.active = this.tabs.index( this.active );
			}

			this._refresh();
		},

		_refresh: function() {
			this._setOptionDisabled( this.options.disabled );
			this._setupEvents( this.options.event );
			this._setupHeightStyle( this.options.heightStyle );

			this.tabs.not( this.active ).attr( {
				"aria-selected": "false",
				"aria-expanded": "false",
				tabIndex: -1
			} );
			this.panels.not( this._getPanelForTab( this.active ) )
			.hide()
			.attr( {
				"aria-hidden": "true"
			} );

			// Make sure one tab is in the tab order
			if ( !this.active.length ) {
				this.tabs.eq( 0 ).attr( "tabIndex", 0 );
			} else {
				this.active
				.attr( {
					"aria-selected": "true",
					"aria-expanded": "true",
					tabIndex: 0
				} );
				this._addClass( this.active, "ui-tabs-active", "ui-state-active" );
				this._getPanelForTab( this.active )
				.show()
				.attr( {
					"aria-hidden": "false"
				} );
			}
		},

		_processTabs: function() {
			var that = this,
				prevTabs = this.tabs,
				prevAnchors = this.anchors,
				prevPanels = this.panels;

			this.tablist = this._getList().attr( "role", "tablist" );
			this._addClass( this.tablist, "ui-tabs-nav",
				"ui-helper-reset ui-helper-clearfix ui-widget-header" );

			// Prevent users from focusing disabled tabs via click
			this.tablist
			.on( "mousedown" + this.eventNamespace, "> li", function( event ) {
				if ( $( this ).is( ".ui-state-disabled" ) ) {
					event.preventDefault();
				}
			} )

			// Support: IE <9
			// Preventing the default action in mousedown doesn't prevent IE
			// from focusing the element, so if the anchor gets focused, blur.
			// We don't have to worry about focusing the previously focused
			// element since clicking on a non-focusable element should focus
			// the body anyway.
			.on( "focus" + this.eventNamespace, ".ui-tabs-anchor", function() {
				if ( $( this ).closest( "li" ).is( ".ui-state-disabled" ) ) {
					this.blur();
				}
			} );

			this.tabs = this.tablist.find( "> li:has(a[href])" )
			.attr( {
				role: "tab",
				tabIndex: -1
			} );
			this._addClass( this.tabs, "ui-tabs-tab", "ui-state-default" );

			this.anchors = this.tabs.map( function() {
				return $( "a", this )[ 0 ];
			} )
			.attr( {
				tabIndex: -1
			} );
			this._addClass( this.anchors, "ui-tabs-anchor" );

			this.panels = $();

			this.anchors.each( function( i, anchor ) {
				var selector, panel, panelId,
					anchorId = $( anchor ).uniqueId().attr( "id" ),
					tab = $( anchor ).closest( "li" ),
					originalAriaControls = tab.attr( "aria-controls" );

				// Inline tab
				if ( that._isLocal( anchor ) ) {
					selector = anchor.hash;
					panelId = selector.substring( 1 );
					panel = that.element.find( that._sanitizeSelector( selector ) );

					// remote tab
				} else {

					// If the tab doesn't already have aria-controls,
					// generate an id by using a throw-away element
					panelId = tab.attr( "aria-controls" ) || $( {} ).uniqueId()[ 0 ].id;
					selector = "#" + panelId;
					panel = that.element.find( selector );
					if ( !panel.length ) {
						panel = that._createPanel( panelId );
						panel.insertAfter( that.panels[ i - 1 ] || that.tablist );
					}
					panel.attr( "aria-live", "polite" );
				}

				if ( panel.length ) {
					that.panels = that.panels.add( panel );
				}
				if ( originalAriaControls ) {
					tab.data( "ui-tabs-aria-controls", originalAriaControls );
				}
				tab.attr( {
					"aria-controls": panelId,
					"aria-labelledby": anchorId
				} );
				panel.attr( "aria-labelledby", anchorId );
			} );

			this.panels.attr( "role", "tabpanel" );
			this._addClass( this.panels, "ui-tabs-panel", "ui-widget-content" );

			// Avoid memory leaks (#10056)
			if ( prevTabs ) {
				this._off( prevTabs.not( this.tabs ) );
				this._off( prevAnchors.not( this.anchors ) );
				this._off( prevPanels.not( this.panels ) );
			}
		},

		// Allow overriding how to find the list for rare usage scenarios (#7715)
		_getList: function() {
			return this.tablist || this.element.find( "ol, ul" ).eq( 0 );
		},

		_createPanel: function( id ) {
			return $( "<div>" )
			.attr( "id", id )
			.data( "ui-tabs-destroy", true );
		},

		_setOptionDisabled: function( disabled ) {
			var currentItem, li, i;

			if ( Array.isArray( disabled ) ) {
				if ( !disabled.length ) {
					disabled = false;
				} else if ( disabled.length === this.anchors.length ) {
					disabled = true;
				}
			}

			// Disable tabs
			for ( i = 0; ( li = this.tabs[ i ] ); i++ ) {
				currentItem = $( li );
				if ( disabled === true || $.inArray( i, disabled ) !== -1 ) {
					currentItem.attr( "aria-disabled", "true" );
					this._addClass( currentItem, null, "ui-state-disabled" );
				} else {
					currentItem.removeAttr( "aria-disabled" );
					this._removeClass( currentItem, null, "ui-state-disabled" );
				}
			}

			this.options.disabled = disabled;

			this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null,
				disabled === true );
		},

		_setupEvents: function( event ) {
			var events = {};
			if ( event ) {
				$.each( event.split( " " ), function( index, eventName ) {
					events[ eventName ] = "_eventHandler";
				} );
			}

			this._off( this.anchors.add( this.tabs ).add( this.panels ) );

			// Always prevent the default action, even when disabled
			this._on( true, this.anchors, {
				click: function( event ) {
					event.preventDefault();
				}
			} );
			this._on( this.anchors, events );
			this._on( this.tabs, { keydown: "_tabKeydown" } );
			this._on( this.panels, { keydown: "_panelKeydown" } );

			this._focusable( this.tabs );
			this._hoverable( this.tabs );
		},

		_setupHeightStyle: function( heightStyle ) {
			var maxHeight,
				parent = this.element.parent();

			if ( heightStyle === "fill" ) {
				maxHeight = parent.height();
				maxHeight -= this.element.outerHeight() - this.element.height();

				this.element.siblings( ":visible" ).each( function() {
					var elem = $( this ),
						position = elem.css( "position" );

					if ( position === "absolute" || position === "fixed" ) {
						return;
					}
					maxHeight -= elem.outerHeight( true );
				} );

				this.element.children().not( this.panels ).each( function() {
					maxHeight -= $( this ).outerHeight( true );
				} );

				this.panels.each( function() {
					$( this ).height( Math.max( 0, maxHeight -
						$( this ).innerHeight() + $( this ).height() ) );
				} )
				.css( "overflow", "auto" );
			} else if ( heightStyle === "auto" ) {
				maxHeight = 0;
				this.panels.each( function() {
					maxHeight = Math.max( maxHeight, $( this ).height( "" ).height() );
				} ).height( maxHeight );
			}
		},

		_eventHandler: function( event ) {
			var options = this.options,
				active = this.active,
				anchor = $( event.currentTarget ),
				tab = anchor.closest( "li" ),
				clickedIsActive = tab[ 0 ] === active[ 0 ],
				collapsing = clickedIsActive && options.collapsible,
				toShow = collapsing ? $() : this._getPanelForTab( tab ),
				toHide = !active.length ? $() : this._getPanelForTab( active ),
				eventData = {
					oldTab: active,
					oldPanel: toHide,
					newTab: collapsing ? $() : tab,
					newPanel: toShow
				};

			event.preventDefault();

			if ( tab.hasClass( "ui-state-disabled" ) ||

				// tab is already loading
				tab.hasClass( "ui-tabs-loading" ) ||

				// can't switch durning an animation
				this.running ||

				// click on active header, but not collapsible
				( clickedIsActive && !options.collapsible ) ||

				// allow canceling activation
				( this._trigger( "beforeActivate", event, eventData ) === false ) ) {
				return;
			}

			options.active = collapsing ? false : this.tabs.index( tab );

			this.active = clickedIsActive ? $() : tab;
			if ( this.xhr ) {
				this.xhr.abort();
			}

			if ( !toHide.length && !toShow.length ) {
				$.error( "jQuery UI Tabs: Mismatching fragment identifier." );
			}

			if ( toShow.length ) {
				this.load( this.tabs.index( tab ), event );
			}
			this._toggle( event, eventData );
		},

		// Handles show/hide for selecting tabs
		_toggle: function( event, eventData ) {
			var that = this,
				toShow = eventData.newPanel,
				toHide = eventData.oldPanel;

			this.running = true;

			function complete() {
				that.running = false;
				that._trigger( "activate", event, eventData );
			}

			function show() {
				that._addClass( eventData.newTab.closest( "li" ), "ui-tabs-active", "ui-state-active" );

				if ( toShow.length && that.options.show ) {
					that._show( toShow, that.options.show, complete );
				} else {
					toShow.show();
					complete();
				}
			}

			// Start out by hiding, then showing, then completing
			if ( toHide.length && this.options.hide ) {
				this._hide( toHide, this.options.hide, function() {
					that._removeClass( eventData.oldTab.closest( "li" ),
						"ui-tabs-active", "ui-state-active" );
					show();
				} );
			} else {
				this._removeClass( eventData.oldTab.closest( "li" ),
					"ui-tabs-active", "ui-state-active" );
				toHide.hide();
				show();
			}

			toHide.attr( "aria-hidden", "true" );
			eventData.oldTab.attr( {
				"aria-selected": "false",
				"aria-expanded": "false"
			} );

			// If we're switching tabs, remove the old tab from the tab order.
			// If we're opening from collapsed state, remove the previous tab from the tab order.
			// If we're collapsing, then keep the collapsing tab in the tab order.
			if ( toShow.length && toHide.length ) {
				eventData.oldTab.attr( "tabIndex", -1 );
			} else if ( toShow.length ) {
				this.tabs.filter( function() {
					return $( this ).attr( "tabIndex" ) === 0;
				} )
				.attr( "tabIndex", -1 );
			}

			toShow.attr( "aria-hidden", "false" );
			eventData.newTab.attr( {
				"aria-selected": "true",
				"aria-expanded": "true",
				tabIndex: 0
			} );
		},

		_activate: function( index ) {
			var anchor,
				active = this._findActive( index );

			// Trying to activate the already active panel
			if ( active[ 0 ] === this.active[ 0 ] ) {
				return;
			}

			// Trying to collapse, simulate a click on the current active header
			if ( !active.length ) {
				active = this.active;
			}

			anchor = active.find( ".ui-tabs-anchor" )[ 0 ];
			this._eventHandler( {
				target: anchor,
				currentTarget: anchor,
				preventDefault: $.noop
			} );
		},

		_findActive: function( index ) {
			return index === false ? $() : this.tabs.eq( index );
		},

		_getIndex: function( index ) {

			// meta-function to give users option to provide a href string instead of a numerical index.
			if ( typeof index === "string" ) {
				index = this.anchors.index( this.anchors.filter( "[href$='" +
					$.escapeSelector( index ) + "']" ) );
			}

			return index;
		},

		_destroy: function() {
			if ( this.xhr ) {
				this.xhr.abort();
			}

			this.tablist
			.removeAttr( "role" )
			.off( this.eventNamespace );

			this.anchors
			.removeAttr( "role tabIndex" )
			.removeUniqueId();

			this.tabs.add( this.panels ).each( function() {
				if ( $.data( this, "ui-tabs-destroy" ) ) {
					$( this ).remove();
				} else {
					$( this ).removeAttr( "role tabIndex " +
						"aria-live aria-busy aria-selected aria-labelledby aria-hidden aria-expanded" );
				}
			} );

			this.tabs.each( function() {
				var li = $( this ),
					prev = li.data( "ui-tabs-aria-controls" );
				if ( prev ) {
					li
					.attr( "aria-controls", prev )
					.removeData( "ui-tabs-aria-controls" );
				} else {
					li.removeAttr( "aria-controls" );
				}
			} );

			this.panels.show();

			if ( this.options.heightStyle !== "content" ) {
				this.panels.css( "height", "" );
			}
		},

		enable: function( index ) {
			var disabled = this.options.disabled;
			if ( disabled === false ) {
				return;
			}

			if ( index === undefined ) {
				disabled = false;
			} else {
				index = this._getIndex( index );
				if ( Array.isArray( disabled ) ) {
					disabled = $.map( disabled, function( num ) {
						return num !== index ? num : null;
					} );
				} else {
					disabled = $.map( this.tabs, function( li, num ) {
						return num !== index ? num : null;
					} );
				}
			}
			this._setOptionDisabled( disabled );
		},

		disable: function( index ) {
			var disabled = this.options.disabled;
			if ( disabled === true ) {
				return;
			}

			if ( index === undefined ) {
				disabled = true;
			} else {
				index = this._getIndex( index );
				if ( $.inArray( index, disabled ) !== -1 ) {
					return;
				}
				if ( Array.isArray( disabled ) ) {
					disabled = $.merge( [ index ], disabled ).sort();
				} else {
					disabled = [ index ];
				}
			}
			this._setOptionDisabled( disabled );
		},

		load: function( index, event ) {
			index = this._getIndex( index );
			var that = this,
				tab = this.tabs.eq( index ),
				anchor = tab.find( ".ui-tabs-anchor" ),
				panel = this._getPanelForTab( tab ),
				eventData = {
					tab: tab,
					panel: panel
				},
				complete = function( jqXHR, status ) {
					if ( status === "abort" ) {
						that.panels.stop( false, true );
					}

					that._removeClass( tab, "ui-tabs-loading" );
					panel.removeAttr( "aria-busy" );

					if ( jqXHR === that.xhr ) {
						delete that.xhr;
					}
				};

			// Not remote
			if ( this._isLocal( anchor[ 0 ] ) ) {
				return;
			}

			this.xhr = $.ajax( this._ajaxSettings( anchor, event, eventData ) );

			// Support: jQuery <1.8
			// jQuery <1.8 returns false if the request is canceled in beforeSend,
			// but as of 1.8, $.ajax() always returns a jqXHR object.
			if ( this.xhr && this.xhr.statusText !== "canceled" ) {
				this._addClass( tab, "ui-tabs-loading" );
				panel.attr( "aria-busy", "true" );

				this.xhr
				.done( function( response, status, jqXHR ) {

					// support: jQuery <1.8
					// http://bugs.jquery.com/ticket/11778
					setTimeout( function() {
						panel.html( response );
						that._trigger( "load", event, eventData );

						complete( jqXHR, status );
					}, 1 );
				} )
				.fail( function( jqXHR, status ) {

					// support: jQuery <1.8
					// http://bugs.jquery.com/ticket/11778
					setTimeout( function() {
						complete( jqXHR, status );
					}, 1 );
				} );
			}
		},

		_ajaxSettings: function( anchor, event, eventData ) {
			var that = this;
			return {

				// Support: IE <11 only
				// Strip any hash that exists to prevent errors with the Ajax request
				url: anchor.attr( "href" ).replace( /#.*$/, "" ),
				beforeSend: function( jqXHR, settings ) {
					return that._trigger( "beforeLoad", event,
						$.extend( { jqXHR: jqXHR, ajaxSettings: settings }, eventData ) );
				}
			};
		},

		_getPanelForTab: function( tab ) {
			var id = $( tab ).attr( "aria-controls" );
			return this.element.find( this._sanitizeSelector( "#" + id ) );
		}
	} );

// DEPRECATED
// TODO: Switch return back to widget declaration at top of file when this is removed
	if ( $.uiBackCompat !== false ) {

		// Backcompat for ui-tab class (now ui-tabs-tab)
		$.widget( "ui.tabs", $.ui.tabs, {
			_processTabs: function() {
				this._superApply( arguments );
				this._addClass( this.tabs, "ui-tab" );
			}
		} );
	}

	var widgetsTabs = $.ui.tabs;


	/*!
 * jQuery UI Tooltip 1.13.0
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Tooltip
//>>group: Widgets
//>>description: Shows additional information for any element on hover or focus.
//>>docs: http://api.jqueryui.com/tooltip/
//>>demos: http://jqueryui.com/tooltip/
//>>css.structure: ../../themes/base/core.css
//>>css.structure: ../../themes/base/tooltip.css
//>>css.theme: ../../themes/base/theme.css


	$.widget( "ui.tooltip", {
		version: "1.13.0",
		options: {
			classes: {
				"ui-tooltip": "ui-corner-all ui-widget-shadow"
			},
			content: function() {
				var title = $( this ).attr( "title" );

				// Escape title, since we're going from an attribute to raw HTML
				return $( "<a>" ).text( title ).html();
			},
			hide: true,

			// Disabled elements have inconsistent behavior across browsers (#8661)
			items: "[title]:not([disabled])",
			position: {
				my: "left top+15",
				at: "left bottom",
				collision: "flipfit flip"
			},
			show: true,
			track: false,

			// Callbacks
			close: null,
			open: null
		},

		_addDescribedBy: function( elem, id ) {
			var describedby = ( elem.attr( "aria-describedby" ) || "" ).split( /\s+/ );
			describedby.push( id );
			elem
			.data( "ui-tooltip-id", id )
			.attr( "aria-describedby", String.prototype.trim.call( describedby.join( " " ) ) );
		},

		_removeDescribedBy: function( elem ) {
			var id = elem.data( "ui-tooltip-id" ),
				describedby = ( elem.attr( "aria-describedby" ) || "" ).split( /\s+/ ),
				index = $.inArray( id, describedby );

			if ( index !== -1 ) {
				describedby.splice( index, 1 );
			}

			elem.removeData( "ui-tooltip-id" );
			describedby = String.prototype.trim.call( describedby.join( " " ) );
			if ( describedby ) {
				elem.attr( "aria-describedby", describedby );
			} else {
				elem.removeAttr( "aria-describedby" );
			}
		},

		_create: function() {
			this._on( {
				mouseover: "open",
				focusin: "open"
			} );

			// IDs of generated tooltips, needed for destroy
			this.tooltips = {};

			// IDs of parent tooltips where we removed the title attribute
			this.parents = {};

			// Append the aria-live region so tooltips announce correctly
			this.liveRegion = $( "<div>" )
			.attr( {
				role: "log",
				"aria-live": "assertive",
				"aria-relevant": "additions"
			} )
			.appendTo( this.document[ 0 ].body );
			this._addClass( this.liveRegion, null, "ui-helper-hidden-accessible" );

			this.disabledTitles = $( [] );
		},

		_setOption: function( key, value ) {
			var that = this;

			this._super( key, value );

			if ( key === "content" ) {
				$.each( this.tooltips, function( id, tooltipData ) {
					that._updateContent( tooltipData.element );
				} );
			}
		},

		_setOptionDisabled: function( value ) {
			this[ value ? "_disable" : "_enable" ]();
		},

		_disable: function() {
			var that = this;

			// Close open tooltips
			$.each( this.tooltips, function( id, tooltipData ) {
				var event = $.Event( "blur" );
				event.target = event.currentTarget = tooltipData.element[ 0 ];
				that.close( event, true );
			} );

			// Remove title attributes to prevent native tooltips
			this.disabledTitles = this.disabledTitles.add(
				this.element.find( this.options.items ).addBack()
				.filter( function() {
					var element = $( this );
					if ( element.is( "[title]" ) ) {
						return element
						.data( "ui-tooltip-title", element.attr( "title" ) )
						.removeAttr( "title" );
					}
				} )
			);
		},

		_enable: function() {

			// restore title attributes
			this.disabledTitles.each( function() {
				var element = $( this );
				if ( element.data( "ui-tooltip-title" ) ) {
					element.attr( "title", element.data( "ui-tooltip-title" ) );
				}
			} );
			this.disabledTitles = $( [] );
		},

		open: function( event ) {
			var that = this,
				target = $( event ? event.target : this.element )

				// we need closest here due to mouseover bubbling,
				// but always pointing at the same event target
				.closest( this.options.items );

			// No element to show a tooltip for or the tooltip is already open
			if ( !target.length || target.data( "ui-tooltip-id" ) ) {
				return;
			}

			if ( target.attr( "title" ) ) {
				target.data( "ui-tooltip-title", target.attr( "title" ) );
			}

			target.data( "ui-tooltip-open", true );

			// Kill parent tooltips, custom or native, for hover
			if ( event && event.type === "mouseover" ) {
				target.parents().each( function() {
					var parent = $( this ),
						blurEvent;
					if ( parent.data( "ui-tooltip-open" ) ) {
						blurEvent = $.Event( "blur" );
						blurEvent.target = blurEvent.currentTarget = this;
						that.close( blurEvent, true );
					}
					if ( parent.attr( "title" ) ) {
						parent.uniqueId();
						that.parents[ this.id ] = {
							element: this,
							title: parent.attr( "title" )
						};
						parent.attr( "title", "" );
					}
				} );
			}

			this._registerCloseHandlers( event, target );
			this._updateContent( target, event );
		},

		_updateContent: function( target, event ) {
			var content,
				contentOption = this.options.content,
				that = this,
				eventType = event ? event.type : null;

			if ( typeof contentOption === "string" || contentOption.nodeType ||
				contentOption.jquery ) {
				return this._open( event, target, contentOption );
			}

			content = contentOption.call( target[ 0 ], function( response ) {

				// IE may instantly serve a cached response for ajax requests
				// delay this call to _open so the other call to _open runs first
				that._delay( function() {

					// Ignore async response if tooltip was closed already
					if ( !target.data( "ui-tooltip-open" ) ) {
						return;
					}

					// JQuery creates a special event for focusin when it doesn't
					// exist natively. To improve performance, the native event
					// object is reused and the type is changed. Therefore, we can't
					// rely on the type being correct after the event finished
					// bubbling, so we set it back to the previous value. (#8740)
					if ( event ) {
						event.type = eventType;
					}
					this._open( event, target, response );
				} );
			} );
			if ( content ) {
				this._open( event, target, content );
			}
		},

		_open: function( event, target, content ) {
			var tooltipData, tooltip, delayedShow, a11yContent,
				positionOption = $.extend( {}, this.options.position );

			if ( !content ) {
				return;
			}

			// Content can be updated multiple times. If the tooltip already
			// exists, then just update the content and bail.
			tooltipData = this._find( target );
			if ( tooltipData ) {
				tooltipData.tooltip.find( ".ui-tooltip-content" ).html( content );
				return;
			}

			// If we have a title, clear it to prevent the native tooltip
			// we have to check first to avoid defining a title if none exists
			// (we don't want to cause an element to start matching [title])
			//
			// We use removeAttr only for key events, to allow IE to export the correct
			// accessible attributes. For mouse events, set to empty string to avoid
			// native tooltip showing up (happens only when removing inside mouseover).
			if ( target.is( "[title]" ) ) {
				if ( event && event.type === "mouseover" ) {
					target.attr( "title", "" );
				} else {
					target.removeAttr( "title" );
				}
			}

			tooltipData = this._tooltip( target );
			tooltip = tooltipData.tooltip;
			this._addDescribedBy( target, tooltip.attr( "id" ) );
			tooltip.find( ".ui-tooltip-content" ).html( content );

			// Support: Voiceover on OS X, JAWS on IE <= 9
			// JAWS announces deletions even when aria-relevant="additions"
			// Voiceover will sometimes re-read the entire log region's contents from the beginning
			this.liveRegion.children().hide();
			a11yContent = $( "<div>" ).html( tooltip.find( ".ui-tooltip-content" ).html() );
			a11yContent.removeAttr( "name" ).find( "[name]" ).removeAttr( "name" );
			a11yContent.removeAttr( "id" ).find( "[id]" ).removeAttr( "id" );
			a11yContent.appendTo( this.liveRegion );

			function position( event ) {
				positionOption.of = event;
				if ( tooltip.is( ":hidden" ) ) {
					return;
				}
				tooltip.position( positionOption );
			}
			if ( this.options.track && event && /^mouse/.test( event.type ) ) {
				this._on( this.document, {
					mousemove: position
				} );

				// trigger once to override element-relative positioning
				position( event );
			} else {
				tooltip.position( $.extend( {
					of: target
				}, this.options.position ) );
			}

			tooltip.hide();

			this._show( tooltip, this.options.show );

			// Handle tracking tooltips that are shown with a delay (#8644). As soon
			// as the tooltip is visible, position the tooltip using the most recent
			// event.
			// Adds the check to add the timers only when both delay and track options are set (#14682)
			if ( this.options.track && this.options.show && this.options.show.delay ) {
				delayedShow = this.delayedShow = setInterval( function() {
					if ( tooltip.is( ":visible" ) ) {
						position( positionOption.of );
						clearInterval( delayedShow );
					}
				}, 13 );
			}

			this._trigger( "open", event, { tooltip: tooltip } );
		},

		_registerCloseHandlers: function( event, target ) {
			var events = {
				keyup: function( event ) {
					if ( event.keyCode === $.ui.keyCode.ESCAPE ) {
						var fakeEvent = $.Event( event );
						fakeEvent.currentTarget = target[ 0 ];
						this.close( fakeEvent, true );
					}
				}
			};

			// Only bind remove handler for delegated targets. Non-delegated
			// tooltips will handle this in destroy.
			if ( target[ 0 ] !== this.element[ 0 ] ) {
				events.remove = function() {
					this._removeTooltip( this._find( target ).tooltip );
				};
			}

			if ( !event || event.type === "mouseover" ) {
				events.mouseleave = "close";
			}
			if ( !event || event.type === "focusin" ) {
				events.focusout = "close";
			}
			this._on( true, target, events );
		},

		close: function( event ) {
			var tooltip,
				that = this,
				target = $( event ? event.currentTarget : this.element ),
				tooltipData = this._find( target );

			// The tooltip may already be closed
			if ( !tooltipData ) {

				// We set ui-tooltip-open immediately upon open (in open()), but only set the
				// additional data once there's actually content to show (in _open()). So even if the
				// tooltip doesn't have full data, we always remove ui-tooltip-open in case we're in
				// the period between open() and _open().
				target.removeData( "ui-tooltip-open" );
				return;
			}

			tooltip = tooltipData.tooltip;

			// Disabling closes the tooltip, so we need to track when we're closing
			// to avoid an infinite loop in case the tooltip becomes disabled on close
			if ( tooltipData.closing ) {
				return;
			}

			// Clear the interval for delayed tracking tooltips
			clearInterval( this.delayedShow );

			// Only set title if we had one before (see comment in _open())
			// If the title attribute has changed since open(), don't restore
			if ( target.data( "ui-tooltip-title" ) && !target.attr( "title" ) ) {
				target.attr( "title", target.data( "ui-tooltip-title" ) );
			}

			this._removeDescribedBy( target );

			tooltipData.hiding = true;
			tooltip.stop( true );
			this._hide( tooltip, this.options.hide, function() {
				that._removeTooltip( $( this ) );
			} );

			target.removeData( "ui-tooltip-open" );
			this._off( target, "mouseleave focusout keyup" );

			// Remove 'remove' binding only on delegated targets
			if ( target[ 0 ] !== this.element[ 0 ] ) {
				this._off( target, "remove" );
			}
			this._off( this.document, "mousemove" );

			if ( event && event.type === "mouseleave" ) {
				$.each( this.parents, function( id, parent ) {
					$( parent.element ).attr( "title", parent.title );
					delete that.parents[ id ];
				} );
			}

			tooltipData.closing = true;
			this._trigger( "close", event, { tooltip: tooltip } );
			if ( !tooltipData.hiding ) {
				tooltipData.closing = false;
			}
		},

		_tooltip: function( element ) {
			var tooltip = $( "<div>" ).attr( "role", "tooltip" ),
				content = $( "<div>" ).appendTo( tooltip ),
				id = tooltip.uniqueId().attr( "id" );

			this._addClass( content, "ui-tooltip-content" );
			this._addClass( tooltip, "ui-tooltip", "ui-widget ui-widget-content" );

			tooltip.appendTo( this._appendTo( element ) );

			return this.tooltips[ id ] = {
				element: element,
				tooltip: tooltip
			};
		},

		_find: function( target ) {
			var id = target.data( "ui-tooltip-id" );
			return id ? this.tooltips[ id ] : null;
		},

		_removeTooltip: function( tooltip ) {

			// Clear the interval for delayed tracking tooltips
			clearInterval( this.delayedShow );

			tooltip.remove();
			delete this.tooltips[ tooltip.attr( "id" ) ];
		},

		_appendTo: function( target ) {
			var element = target.closest( ".ui-front, dialog" );

			if ( !element.length ) {
				element = this.document[ 0 ].body;
			}

			return element;
		},

		_destroy: function() {
			var that = this;

			// Close open tooltips
			$.each( this.tooltips, function( id, tooltipData ) {

				// Delegate to close method to handle common cleanup
				var event = $.Event( "blur" ),
					element = tooltipData.element;
				event.target = event.currentTarget = element[ 0 ];
				that.close( event, true );

				// Remove immediately; destroying an open tooltip doesn't use the
				// hide animation
				$( "#" + id ).remove();

				// Restore the title
				if ( element.data( "ui-tooltip-title" ) ) {

					// If the title attribute has changed since open(), don't restore
					if ( !element.attr( "title" ) ) {
						element.attr( "title", element.data( "ui-tooltip-title" ) );
					}
					element.removeData( "ui-tooltip-title" );
				}
			} );
			this.liveRegion.remove();
		}
	});

// DEPRECATED
// TODO: Switch return back to widget declaration at top of file when this is removed
	if ( $.uiBackCompat !== false ) {

		// Backcompat for tooltipClass option
		$.widget( "ui.tooltip", $.ui.tooltip, {
			options: {
				tooltipClass: null
			},
			_tooltip: function() {
				var tooltipData = this._superApply( arguments );
				if ( this.options.tooltipClass ) {
					tooltipData.tooltip.addClass( this.options.tooltipClass );
				}
				return tooltipData;
			}
		} );
	}

	var widgetsTooltip = $.ui.tooltip;
});

/*!
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function ($) {

	// Detect touch support
	$.support.touch = ('ontouchend' in document || navigator.maxTouchPoints > 0);

	// Ignore browsers without touch support
	if (!$.support.touch) {
		return;
	}

	var mouseProto = $.ui.mouse.prototype,
		_mouseInit = mouseProto._mouseInit,
		touchHandled;

	/**
	 * Simulate a mouse event based on a corresponding touch event
	 * @param {Object} event A touch event
	 * @param {String} simulatedType The corresponding mouse event
	 */
	function simulateMouseEvent (event, simulatedType) {

		// Ignore multi-touch events
		if (event.originalEvent.touches.length > 1) {
			return;
		}

		event.preventDefault();

		var touch = event.originalEvent.changedTouches[0],
			simulatedEvent = document.createEvent('MouseEvents');

		// Initialize the simulated mouse event using the touch event's coordinates
		simulatedEvent.initMouseEvent(
			simulatedType,    // type
			true,             // bubbles
			true,             // cancelable
			window,           // view
			1,                // detail
			touch.screenX,    // screenX
			touch.screenY,    // screenY
			touch.clientX,    // clientX
			touch.clientY,    // clientY
			false,            // ctrlKey
			false,            // altKey
			false,            // shiftKey
			false,            // metaKey
			0,                // button
			null              // relatedTarget
		);

		// Dispatch the simulated event to the target element
		event.target.dispatchEvent(simulatedEvent);
	}

	/**
	 * Handle the jQuery UI widget's touchstart events
	 * @param {Object} event The widget element's touchstart event
	 */
	mouseProto._touchStart = function (event) {
		var self = this;

		// Ignore the event if another widget is already being handled
		if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
			return;
		}

		// Set the flag to prevent other widgets from inheriting the touch event
		touchHandled = true;

		// Track movement to determine if interaction was a click
		self._touchMoved = false;

		// Simulate the mouseover event
		simulateMouseEvent(event, 'mouseover');

		// Simulate the mousemove event
		simulateMouseEvent(event, 'mousemove');

		// Simulate the mousedown event
		simulateMouseEvent(event, 'mousedown');
	};

	/**
	 * Handle the jQuery UI widget's touchmove events
	 * @param {Object} event The document's touchmove event
	 */
	mouseProto._touchMove = function (event) {

		// Ignore event if not handled
		if (!touchHandled) {
			return;
		}

		// Interaction was not a click
		this._touchMoved = true;

		// Simulate the mousemove event
		simulateMouseEvent(event, 'mousemove');
	};

	/**
	 * Handle the jQuery UI widget's touchend events
	 * @param {Object} event The document's touchend event
	 */
	mouseProto._touchEnd = function (event) {

		// Ignore event if not handled
		if (!touchHandled) {
			return;
		}

		// Simulate the mouseup event
		simulateMouseEvent(event, 'mouseup');

		// Simulate the mouseout event
		simulateMouseEvent(event, 'mouseout');

		// If the touch interaction did not move, it should trigger a click
		if (!this._touchMoved) {

			// Simulate the click event
			simulateMouseEvent(event, 'click');
		}

		// Unset the flag to allow other widgets to inherit the touch event
		touchHandled = false;
	};

	/**
	 * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
	 * This method extends the widget with bound touch event handlers that
	 * translate touch events to mouse events and pass them to the widget's
	 * original mouse event handling methods.
	 */
	mouseProto._mouseInit = function () {

		var self = this;

		// Delegate the touch handlers to the widget's element
		self.element
		.bind('touchstart', $.proxy(self, '_touchStart'))
		.bind('touchmove', $.proxy(self, '_touchMove'))
		.bind('touchend', $.proxy(self, '_touchEnd'));

		// Call the original $.ui.mouse init method
		_mouseInit.call(self);
	};

})(jQuery);

(function (jQuery) {
	// This is a hack to make ckeditor work inside modal dialogs. Since ckeditor dialogs are placed on body and not in the ui.dialog's DOM. See http://bugs.jqueryui.com/ticket/9087
	jQuery.widget("ui.dialog", jQuery.ui.dialog, {
		_allowInteraction: function (event) {
			return true;
		}
	});

	jQuery.ui.dialog.prototype._focusTabbable = function () {};
})(jQuery);

jQuery = oldJQuery;
;
H5P.Tooltip = H5P.Tooltip || function() {};

H5P.Question = (function ($, EventDispatcher, JoubelUI) {

  /**
   * Extending this class make it alot easier to create tasks for other
   * content types.
   *
   * @class H5P.Question
   * @extends H5P.EventDispatcher
   * @param {string} type
   */
  function Question(type) {
    var self = this;

    // Inheritance
    EventDispatcher.call(self);

    // Register default section order
    self.order = ['video', 'image', 'audio', 'introduction', 'content', 'explanation', 'feedback', 'scorebar', 'buttons', 'read'];

    // Keep track of registered sections
    var sections = {};

    // Buttons
    var buttons = {};
    var buttonOrder = [];

    // Wrapper when attached
    var $wrapper;

    // Click element
    var clickElement;

    // ScoreBar
    var scoreBar;

    // Keep track of the feedback's visual status.
    var showFeedback;

    // Keep track of which buttons are scheduled for hiding.
    var buttonsToHide = [];

    // Keep track of which buttons are scheduled for showing.
    var buttonsToShow = [];

    // Keep track of the hiding and showing of buttons.
    var toggleButtonsTimer;
    var toggleButtonsTransitionTimer;
    var buttonTruncationTimer;

    // Keeps track of initialization of question
    var initialized = false;

    /**
     * @type {Object} behaviour Behaviour of Question
     * @property {Boolean} behaviour.disableFeedback Set to true to disable feedback section
     */
    var behaviour = {
      disableFeedback: false,
      disableReadSpeaker: false
    };

    // Keeps track of thumb state
    var imageThumb = true;

    // Keeps track of image transitions
    var imageTransitionTimer;

    // Keep track of whether sections is transitioning.
    var sectionsIsTransitioning = false;

    // Keep track of auto play state
    var disableAutoPlay = false;

    // Feedback transition timer
    var feedbackTransitionTimer;

    // Used when reading messages to the user
    var $read, readText;

    /**
     * Register section with given content.
     *
     * @private
     * @param {string} section ID of the section
     * @param {(string|H5P.jQuery)} [content]
     */
    var register = function (section, content) {
      sections[section] = {};
      var $e = sections[section].$element = $('<div/>', {
        'class': 'h5p-question-' + section,
      });
      if (content) {
        $e[content instanceof $ ? 'append' : 'html'](content);
      }
    };

    /**
     * Update registered section with content.
     *
     * @private
     * @param {string} section ID of the section
     * @param {(string|H5P.jQuery)} content
     */
    var update = function (section, content) {
      if (content instanceof $) {
        sections[section].$element.html('').append(content);
      }
      else {
        sections[section].$element.html(content);
      }
    };

    /**
     * Insert element with given ID into the DOM.
     *
     * @private
     * @param {array|Array|string[]} order
     * List with ordered element IDs
     * @param {string} id
     * ID of the element to be inserted
     * @param {Object} elements
     * Maps ID to the elements
     * @param {H5P.jQuery} $container
     * Parent container of the elements
     */
    var insert = function (order, id, elements, $container) {
      // Try to find an element id should be after
      for (var i = 0; i < order.length; i++) {
        if (order[i] === id) {
          // Found our pos
          while (i > 0 &&
          (elements[order[i - 1]] === undefined ||
          !elements[order[i - 1]].isVisible)) {
            i--;
          }
          if (i === 0) {
            // We are on top.
            elements[id].$element.prependTo($container);
          }
          else {
            // Add after element
            elements[id].$element.insertAfter(elements[order[i - 1]].$element);
          }
          elements[id].isVisible = true;
          break;
        }
      }
    };

    /**
     * Make feedback into a popup and position relative to click.
     *
     * @private
     * @param {string} [closeText] Text for the close button
     */
    var makeFeedbackPopup = function (closeText) {
      var $element = sections.feedback.$element;
      var $parent = sections.content.$element;
      var $click = (clickElement != null ? clickElement.$element : null);

      $element.appendTo($parent).addClass('h5p-question-popup');

      if (sections.scorebar) {
        sections.scorebar.$element.appendTo($element);
      }

      $parent.addClass('h5p-has-question-popup');

      // Draw the tail
      var $tail = $('<div/>', {
        'class': 'h5p-question-feedback-tail'
      }).hide()
        .appendTo($parent);

      // Draw the close button
      var $close = $('<div/>', {
        'class': 'h5p-question-feedback-close',
        'tabindex': 0,
        'title': closeText,
        on: {
          click: function (event) {
            $element.remove();
            $tail.remove();
            event.preventDefault();
          },
          keydown: function (event) {
            switch (event.which) {
              case 13: // Enter
              case 32: // Space
                $element.remove();
                $tail.remove();
                event.preventDefault();
            }
          }
        }
      }).hide().appendTo($element);

      if ($click != null) {
        if ($click.hasClass('correct')) {
          $element.addClass('h5p-question-feedback-correct');
          $close.show();
          sections.buttons.$element.hide();
        }
        else {
          sections.buttons.$element.appendTo(sections.feedback.$element);
        }
      }

      positionFeedbackPopup($element, $click);
    };

    /**
     * Position the feedback popup.
     *
     * @private
     * @param {H5P.jQuery} $element Feedback div
     * @param {H5P.jQuery} $click Visual click div
     */
    var positionFeedbackPopup = function ($element, $click) {
      var $container = $element.parent();
      var $tail = $element.siblings('.h5p-question-feedback-tail');
      var popupWidth = $element.outerWidth();
      var popupHeight = setElementHeight($element);
      var space = 15;
      var disableTail = false;
      var positionY = $container.height() / 2 - popupHeight / 2;
      var positionX = $container.width() / 2 - popupWidth / 2;
      var tailX = 0;
      var tailY = 0;
      var tailRotation = 0;

      if ($click != null) {
        // Edge detection for click, takes space into account
        var clickNearTop = ($click[0].offsetTop < space);
        var clickNearBottom = ($click[0].offsetTop + $click.height() > $container.height() - space);
        var clickNearLeft = ($click[0].offsetLeft < space);
        var clickNearRight = ($click[0].offsetLeft + $click.width() > $container.width() - space);

        // Click is not in a corner or close to edge, calculate position normally
        positionX = $click[0].offsetLeft - popupWidth / 2  + $click.width() / 2;
        positionY = $click[0].offsetTop - popupHeight - space;
        tailX = positionX + popupWidth / 2 - $tail.width() / 2;
        tailY = positionY + popupHeight - ($tail.height() / 2);
        tailRotation = 225;

        // If popup is outside top edge, position under click instead
        if (popupHeight + space > $click[0].offsetTop) {
          positionY = $click[0].offsetTop + $click.height() + space;
          tailY = positionY - $tail.height() / 2 ;
          tailRotation = 45;
        }

        // If popup is outside left edge, position left
        if (positionX < 0) {
          positionX = 0;
        }

        // If popup is outside right edge, position right
        if (positionX + popupWidth > $container.width()) {
          positionX = $container.width() - popupWidth;
        }

        // Special cases such as corner clicks, or close to an edge, they override X and Y positions if met
        if (clickNearTop && (clickNearLeft || clickNearRight)) {
          positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() : -popupWidth);
          positionY = $click[0].offsetTop + $click.height();
          disableTail = true;
        }
        else if (clickNearBottom && (clickNearLeft || clickNearRight)) {
          positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() : -popupWidth);
          positionY = $click[0].offsetTop - popupHeight;
          disableTail = true;
        }
        else if (!clickNearTop && !clickNearBottom) {
          if (clickNearLeft || clickNearRight) {
            positionY = $click[0].offsetTop - popupHeight / 2 + $click.width() / 2;
            positionX = $click[0].offsetLeft + (clickNearLeft ? $click.width() + space : -popupWidth + -space);
            // Make sure this does not position the popup off screen
            if (positionX < 0) {
              positionX = 0;
              disableTail = true;
            }
            else {
              tailX = positionX + (clickNearLeft ? - $tail.width() / 2 : popupWidth - $tail.width() / 2);
              tailY = positionY + popupHeight / 2 - $tail.height() / 2;
              tailRotation = (clickNearLeft ? 315 : 135);
            }
          }
        }

        // Contain popup from overflowing bottom edge
        if (positionY + popupHeight > $container.height()) {
          positionY = $container.height() - popupHeight;

          if (popupHeight > $container.height() - ($click[0].offsetTop + $click.height() + space)) {
            disableTail = true;
          }
        }
      }
      else {
        disableTail = true;
      }

      // Contain popup from ovreflowing top edge
      if (positionY < 0) {
        positionY = 0;
      }

      $element.css({top: positionY, left: positionX});
      $tail.css({top: tailY, left: tailX});

      if (!disableTail) {
        $tail.css({
          'left': tailX,
          'top': tailY,
          'transform': 'rotate(' + tailRotation + 'deg)'
        }).show();
      }
      else {
        $tail.hide();
      }
    };

    /**
     * Set element max height, used for animations.
     *
     * @param {H5P.jQuery} $element
     */
    var setElementHeight = function ($element) {
      if (!$element.is(':visible')) {
        // No animation
        $element.css('max-height', 'none');
        return;
      }

      // If this element is shown in the popup, we can't set width to 100%,
      // since it already has a width set in CSS
      var isFeedbackPopup = $element.hasClass('h5p-question-popup');

      // Get natural element height
      var $tmp = $element.clone()
        .css({
          'position': 'absolute',
          'max-height': 'none',
          'width': isFeedbackPopup ? '' : '100%'
        })
        .appendTo($element.parent());

      // Need to take margins into account when calculating available space
      var sideMargins = parseFloat($element.css('margin-left'))
        + parseFloat($element.css('margin-right'));
      var tmpElWidth = $tmp.css('width') ? $tmp.css('width') : '100%';
      $tmp.css('width', 'calc(' + tmpElWidth + ' - ' + sideMargins + 'px)');

      // Apply height to element
      var h = Math.round($tmp.get(0).getBoundingClientRect().height);
      var fontSize = parseFloat($element.css('fontSize'));
      var relativeH = h / fontSize;
      $element.css('max-height', relativeH + 'em');
      $tmp.remove();

      if (h > 0 && sections.buttons && sections.buttons.$element === $element) {
        // Make sure buttons section is visible
        showSection(sections.buttons);

        // Resize buttons after resizing button section
        setTimeout(resizeButtons, 150);
      }
      return h;
    };

    /**
     * Does the actual job of hiding the buttons scheduled for hiding.
     *
     * @private
     * @param {boolean} [relocateFocus] Find a new button to focus
     */
    var hideButtons = function (relocateFocus) {
      for (var i = 0; i < buttonsToHide.length; i++) {
        hideButton(buttonsToHide[i].id);
      }
      buttonsToHide = [];

      if (relocateFocus) {
        self.focusButton();
      }
    };

    /**
     * Does the actual hiding.
     * @private
     * @param {string} buttonId
     */
    var hideButton = function (buttonId) {
      // Using detach() vs hide() makes it harder to cheat.
      buttons[buttonId].$element.detach();
      buttons[buttonId].isVisible = false;
    };

    /**
     * Shows the buttons on the next tick. This is to avoid buttons flickering
     * If they're both added and removed on the same tick.
     *
     * @private
     */
    var toggleButtons = function () {
      // If no buttons section, return
      if (sections.buttons === undefined) {
        return;
      }

      // Clear transition timer, reevaluate if buttons will be detached
      clearTimeout(toggleButtonsTransitionTimer);

      // Show buttons
      for (var i = 0; i < buttonsToShow.length; i++) {
        insert(buttonOrder, buttonsToShow[i].id, buttons, sections.buttons.$element);
        buttons[buttonsToShow[i].id].isVisible = true;
      }
      buttonsToShow = [];

      // Hide buttons
      var numToHide = 0;
      var relocateFocus = false;
      for (var j = 0; j < buttonsToHide.length; j++) {
        var button = buttons[buttonsToHide[j].id];
        if (button.isVisible) {
          numToHide += 1;
        }
        if (button.$element.is(':focus')) {
          // Move focus to the first visible button.
          relocateFocus = true;
        }
      }

      var animationTimer = 150;
      if (sections.feedback && sections.feedback.$element.hasClass('h5p-question-popup')) {
        animationTimer = 0;
      }

      if (numToHide === sections.buttons.$element.children().length) {
        // All buttons are going to be hidden. Hide container using transition.
        hideSection(sections.buttons);
        // Detach buttons
        hideButtons(relocateFocus);
      }
      else {
        hideButtons(relocateFocus);

        // Show button section
        if (!sections.buttons.$element.is(':empty')) {
          showSection(sections.buttons);
          setElementHeight(sections.buttons.$element);

          // Trigger resize after animation
          toggleButtonsTransitionTimer = setTimeout(function () {
            self.trigger('resize');
          }, animationTimer);
        }

        // Resize buttons to fit container
        resizeButtons();
      }

      toggleButtonsTimer = undefined;
    };

    /**
     * Allows for scaling of the question image.
     */
    var scaleImage = function () {
      var $imgSection = sections.image.$element;
      clearTimeout(imageTransitionTimer);

      // Add this here to avoid initial transition of the image making
      // content overflow. Alternatively we need to trigger a resize.
      $imgSection.addClass('animatable');

      if (imageThumb) {

        // Expand image
        $(this).attr('aria-expanded', true);
        $imgSection.addClass('h5p-question-image-fill-width');
        imageThumb = false;

        imageTransitionTimer = setTimeout(function () {
          self.trigger('resize');
        }, 600);
      }
      else {

        // Scale down image
        $(this).attr('aria-expanded', false);
        $imgSection.removeClass('h5p-question-image-fill-width');
        imageThumb = true;

        imageTransitionTimer = setTimeout(function () {
          self.trigger('resize');
        }, 600);
      }
    };

    /**
     * Get scrollable ancestor of element
     *
     * @private
     * @param {H5P.jQuery} $element
     * @param {Number} [currDepth=0] Current recursive calls to ancestor, stop at maxDepth
     * @param {Number} [maxDepth=5] Maximum depth for finding ancestor.
     * @returns {H5P.jQuery} Parent element that is scrollable
     */
    var findScrollableAncestor = function ($element, currDepth, maxDepth) {
      if (!currDepth) {
        currDepth = 0;
      }
      if (!maxDepth) {
        maxDepth = 5;
      }
      // Check validation of element or if we have reached document root
      if (!$element || !($element instanceof $) || document === $element.get(0) || currDepth >= maxDepth) {
        return;
      }

      if ($element.css('overflow-y') === 'auto') {
        return $element;
      }
      else {
        return findScrollableAncestor($element.parent(), currDepth + 1, maxDepth);
      }
    };

    /**
     * Scroll to bottom of Question.
     *
     * @private
     */
    var scrollToBottom = function () {
      if (!$wrapper || ($wrapper.hasClass('h5p-standalone') && !H5P.isFullscreen)) {
        return; // No scroll
      }

      var scrollableAncestor = findScrollableAncestor($wrapper);

      // Scroll to bottom of scrollable ancestor
      if (scrollableAncestor) {
        scrollableAncestor.animate({
          scrollTop: $wrapper.css('height')
        }, "slow");
      }
    };

    /**
     * Resize buttons to fit container width
     *
     * @private
     */
    var resizeButtons = function () {
      if (!buttons || !sections.buttons) {
        return;
      }

      var go = function () {
        // Don't do anything if button elements are not visible yet
        if (!sections.buttons.$element.is(':visible')) {
          return;
        }

        // Width of all buttons
        var buttonsWidth = {
          max: 0,
          min: 0,
          current: 0
        };

        for (var i in buttons) {
          var button = buttons[i];
          if (button.isVisible) {
            setButtonWidth(buttons[i]);
            buttonsWidth.max += button.width.max;
            buttonsWidth.min += button.width.min;
            buttonsWidth.current += button.isTruncated ? button.width.min : button.width.max;
          }
        }

        var makeButtonsFit = function (availableWidth) {
          if (buttonsWidth.max < availableWidth) {
            // It is room for everyone on the right side of the score bar (without truncating)
            if (buttonsWidth.max !== buttonsWidth.current) {
              // Need to make everyone big
              restoreButtonLabels(buttonsWidth.current, availableWidth);
            }
            return true;
          }
          else if (buttonsWidth.min < availableWidth) {
            // Is it room for everyone on the right side of the score bar with truncating?
            if (buttonsWidth.current > availableWidth) {
              removeButtonLabels(buttonsWidth.current, availableWidth);
            }
            else {
              restoreButtonLabels(buttonsWidth.current, availableWidth);
            }
            return true;
          }
          return false;
        };

        toggleFullWidthScorebar(false);

        var buttonSectionWidth = Math.floor(sections.buttons.$element.width()) - 1;

        if (!makeButtonsFit(buttonSectionWidth)) {
          // If we get here we need to wrap:
          toggleFullWidthScorebar(true);
          buttonSectionWidth = Math.floor(sections.buttons.$element.width()) - 1;
          makeButtonsFit(buttonSectionWidth);
        }
      };

      // If visible, resize right away
      if (sections.buttons.$element.is(':visible')) {
        go();
      }
      else { // If not visible, try on the next tick
        // Clear button truncation timer if within a button truncation function
        if (buttonTruncationTimer) {
          clearTimeout(buttonTruncationTimer);
        }
        buttonTruncationTimer = setTimeout(function () {
          buttonTruncationTimer = undefined;
          go();
        }, 0);
      }
    };

    var toggleFullWidthScorebar = function (enabled) {
      if (sections.scorebar &&
          sections.scorebar.$element &&
          sections.scorebar.$element.hasClass('h5p-question-visible')) {
        sections.buttons.$element.addClass('has-scorebar');
        sections.buttons.$element.toggleClass('wrap', enabled);
        sections.scorebar.$element.toggleClass('full-width', enabled);
      }
      else {
        sections.buttons.$element.removeClass('has-scorebar');
      }
    };

    /**
     * Remove button labels until they use less than max width.
     *
     * @private
     * @param {Number} buttonsWidth Total width of all buttons
     * @param {Number} maxButtonsWidth Max width allowed for buttons
     */
    var removeButtonLabels = function (buttonsWidth, maxButtonsWidth) {
      // Reverse traversal
      for (var i = buttonOrder.length - 1; i >= 0; i--) {
        var buttonId = buttonOrder[i];
        var button = buttons[buttonId];
        if (!button.isTruncated && button.isVisible) {
          var $button = button.$element;
          buttonsWidth -= button.width.max - button.width.min;
          // Set tooltip (needed by H5P.Tooltip)
          let buttonText = $button.text();
          $button.attr('data-tooltip', buttonText);

          // Use button text as aria label if a specific one isn't provided
          if (!button.ariaLabel) {
            $button.attr('aria-label', buttonText);
          }
          // Remove label
          $button.html('').addClass('truncated');
          button.isTruncated = true;
          if (buttonsWidth <= maxButtonsWidth) {
            // Buttons are small enough.
            return;
          }
        }
      }
    };

    /**
     * Restore button labels until it fills maximum possible width without exceeding the max width.
     *
     * @private
     * @param {Number} buttonsWidth Total width of all buttons
     * @param {Number} maxButtonsWidth Max width allowed for buttons
     */
    var restoreButtonLabels = function (buttonsWidth, maxButtonsWidth) {
      for (var i = 0; i < buttonOrder.length; i++) {
        var buttonId = buttonOrder[i];
        var button = buttons[buttonId];
        if (button.isTruncated && button.isVisible) {
          // Calculate new total width of buttons with a static pixel for consistency cross-browser
          buttonsWidth += button.width.max - button.width.min + 1;

          if (buttonsWidth > maxButtonsWidth) {
            return;
          }
          // Restore label
          button.$element.html(button.text);

          // Remove tooltip (used by H5P.Tooltip)
          button.$element.removeAttr('data-tooltip');

          // Remove aria-label if a specific one isn't provided
          if (!button.ariaLabel) {
            button.$element.removeAttr('aria-label');
          }

          button.$element.removeClass('truncated');
          button.isTruncated = false;
        }
      }
    };

    /**
     * Helper function for finding index of keyValue in array
     *
     * @param {String} keyValue Value to be found
     * @param {String} key In key
     * @param {Array} array In array
     * @returns {number}
     */
    var existsInArray = function (keyValue, key, array) {
      var i;
      for (i = 0; i < array.length; i++) {
        if (array[i][key] === keyValue) {
          return i;
        }
      }
      return -1;
    };

    /**
     * Show a section
     * @param {Object} section
     */
    var showSection = function (section) {
      section.$element.addClass('h5p-question-visible');
      section.isVisible = true;
    };

    /**
     * Hide a section
     * @param {Object} section
     */
    var hideSection = function (section) {
      section.$element.css('max-height', '');
      section.isVisible = false;

      setTimeout(function () {
        // Only hide if section hasn't been set to visible in the meantime
        if (!section.isVisible) {
          section.$element.removeClass('h5p-question-visible');
        }
      }, 150);
    };

    /**
     * Set behaviour for question.
     *
     * @param {Object} options An object containing behaviour that will be extended by Question
     */
    self.setBehaviour = function (options) {
      $.extend(behaviour, options);
    };

    /**
     * A video to display above the task.
     *
     * @param {object} params
     */
    self.setVideo = function (params) {
      sections.video = {
        $element: $('<div/>', {
          'class': 'h5p-question-video'
        })
      };

      if (disableAutoPlay && params.params.playback) {
        params.params.playback.autoplay = false;
      }

      // Never fit to wrapper
      if (!params.params.visuals) {
        params.params.visuals = {};
      }
      params.params.visuals.fit = false;
      sections.video.instance = H5P.newRunnable(params, self.contentId, sections.video.$element, true);
      var fromVideo = false; // Hack to avoid never ending loop
      sections.video.instance.on('resize', function () {
        fromVideo = true;
        self.trigger('resize');
        fromVideo = false;
      });
      self.on('resize', function () {
        if (!fromVideo) {
          sections.video.instance.trigger('resize');
        }
      });

      return self;
    };

    /**
     * An audio player to display above the task.
     *
     * @param {object} params
     */
    self.setAudio = function (params) {
      params.params = params.params || {};

      sections.audio = {
        $element: $('<div/>', {
          'class': 'h5p-question-audio',
        })
      };

      if (disableAutoPlay) {
        params.params.autoplay = false;
      }
      else if (params.params.playerMode === 'transparent') {
        params.params.autoplay = true; // false doesn't make sense for transparent audio
      }

      sections.audio.instance = H5P.newRunnable(params, self.contentId, sections.audio.$element, true);
      // The height value that is set by H5P.Audio is counter-productive here.
      if (sections.audio.instance.audio) {
        sections.audio.instance.audio.style.height = '';
      }

      return self;
    };

    /**
     * Will stop any playback going on in the task.
     */
    self.pause = function () {
      if (sections.video && sections.video.isVisible) {
        sections.video.instance.pause();
      }
      if (sections.audio && sections.audio.isVisible) {
        sections.audio.instance.pause();
      }
    };

    /**
     * Start playback of video
     */
    self.play = function () {
      if (sections.video && sections.video.isVisible) {
        sections.video.instance.play();
      }
      if (sections.audio && sections.audio.isVisible) {
        sections.audio.instance.play();
      }
    };

    /**
     * Disable auto play, useful in editors.
     */
    self.disableAutoPlay = function () {
      disableAutoPlay = true;
    };

    /**
     * Process HTML escaped string for use as attribute value,
     * e.g. for alt text or title attributes.
     *
     * @param {string} value
     * @return {string} WARNING! Do NOT use for innerHTML.
     */
    self.massageAttributeOutput = function (value) {
      const dparser = new DOMParser().parseFromString(value, 'text/html');
      const div = document.createElement('div');
      div.innerHTML = dparser.documentElement.textContent;;
      return div.textContent || div.innerText || '';
    };

    /**
     * Add task image.
     *
     * @param {string} path Relative
     * @param {Object} [options] Options object
     * @param {string} [options.alt] Text representation
     * @param {string} [options.title] Hover text
     * @param {Boolean} [options.disableImageZooming] Set as true to disable image zooming
     * @param {string} [options.expandImage] Localization strings
     * @param {string} [options.minimizeImage] Localization string

     */
    self.setImage = function (path, options) {
      options = options ? options : {};
      sections.image = {};
      // Image container
      sections.image.$element = $('<div/>', {
        'class': 'h5p-question-image h5p-question-image-fill-width'
      });

      // Inner wrap
      var $imgWrap = $('<div/>', {
        'class': 'h5p-question-image-wrap',
        appendTo: sections.image.$element
      });

      // Image element
      var $img = $('<img/>', {
        src: H5P.getPath(path, self.contentId),
        alt: (options.alt === undefined ? '' : self.massageAttributeOutput(options.alt)),
        title: (options.title === undefined ? '' : self.massageAttributeOutput(options.title)),
        on: {
          load: function () {
            self.trigger('imageLoaded', this);
            self.trigger('resize');
          }
        },
        appendTo: $imgWrap
      });

      // Disable image zooming
      if (options.disableImageZooming) {
        $img.css('maxHeight', 'none');

        // Make sure we are using the correct amount of width at all times
        var determineImgWidth = function () {

          // Remove margins if natural image width is bigger than section width
          var imageSectionWidth = sections.image.$element.get(0).getBoundingClientRect().width;

          // Do not transition, for instant measurements
          $imgWrap.css({
            '-webkit-transition': 'none',
            'transition': 'none'
          });

          // Margin as translateX on both sides of image.
          var diffX = 2 * ($imgWrap.get(0).getBoundingClientRect().left -
            sections.image.$element.get(0).getBoundingClientRect().left);

          if ($img.get(0).naturalWidth >= imageSectionWidth - diffX) {
            sections.image.$element.addClass('h5p-question-image-fill-width');
          }
          else { // Use margin for small res images
            sections.image.$element.removeClass('h5p-question-image-fill-width');
          }

          // Reset transition rules
          $imgWrap.css({
            '-webkit-transition': '',
            'transition': ''
          });
        };

        // Determine image width
        if ($img.is(':visible')) {
          determineImgWidth();
        }
        else {
          $img.on('load', determineImgWidth);
        }

        // Skip adding zoom functionality
        return;
      }

      const setAriaLabel = () => {
        const ariaLabel = $imgWrap.attr('aria-expanded') === 'true'
          ? options.minimizeImage 
          : options.expandImage;
          
          $imgWrap.attr('aria-label', `${ariaLabel} ${options.alt}`);
        };

      var sizeDetermined = false;
      var determineSize = function () {
        if (sizeDetermined || !$img.is(':visible')) {
          return; // Try again next time.
        }

        $imgWrap.addClass('h5p-question-image-scalable')
          .attr('aria-expanded', false)
          .attr('role', 'button')
          .attr('tabIndex', '0')
          .on('click', function (event) {
            if (event.which === 1) {
              scaleImage.apply(this); // Left mouse button click
              setAriaLabel();
            }
          }).on('keypress', function (event) {
            if (event.which === 32) {
              event.preventDefault(); // Prevent default behaviour; page scroll down
              scaleImage.apply(this); // Space bar pressed
              setAriaLabel();
            }
          });

        setAriaLabel();

        sections.image.$element.removeClass('h5p-question-image-fill-width');

        sizeDetermined  = true; // Prevent any futher events
      };

      self.on('resize', determineSize);

      return self;
    };

    /**
     * Add the introduction section.
     *
     * @param {(string|H5P.jQuery)} content
     */
    self.setIntroduction = function (content) {
      register('introduction', content);

      return self;
    };

    /**
     * Add the content section.
     *
     * @param {(string|H5P.jQuery)} content
     * @param {Object} [options]
     * @param {string} [options.class]
     */
    self.setContent = function (content, options) {
      register('content', content);

      if (options && options.class) {
        sections.content.$element.addClass(options.class);
      }

      return self;
    };

    /**
     * Force readspeaker to read text. Useful when you have to use
     * setTimeout for animations.
     */
    self.read = function (content) {
      if (!$read) {
        return; // Not ready yet
      }

      if (readText) {
        // Combine texts if called multiple times
        readText += (readText.substr(-1, 1) === '.' ? ' ' : '. ') + content;
      }
      else {
        readText = content;
      }

      // Set text
      $read.html(readText);

      setTimeout(function () {
        // Stop combining when done reading
        readText = null;
        $read.html('');
      }, 100);
    };

    /**
     * Read feedback
     */
    self.readFeedback = function () {
      var invalidFeedback =
        behaviour.disableReadSpeaker ||
        !showFeedback ||
        !sections.feedback ||
        !sections.feedback.$element;

      if (invalidFeedback) {
        return;
      }

      var $feedbackText = $('.h5p-question-feedback-content-text', sections.feedback.$element);
      if ($feedbackText && $feedbackText.html() && $feedbackText.html().length) {
        self.read($feedbackText.html());
      }
    };

    /**
     * Remove feedback
     *
     * @return {H5P.Question}
     */
    self.removeFeedback = function () {

      clearTimeout(feedbackTransitionTimer);

      if (sections.feedback && showFeedback) {

        showFeedback = false;

        // Hide feedback & scorebar
        hideSection(sections.scorebar);
        hideSection(sections.feedback);

        sectionsIsTransitioning = true;

        // Detach after transition
        feedbackTransitionTimer = setTimeout(function () {
          // Avoiding Transition.onTransitionEnd since it will register multiple events, and there's no way to cancel it if the transition changes back to "show" while the animation is happening.
          if (!showFeedback) {
            sections.feedback.$element.children().detach();
            sections.scorebar.$element.children().detach();

            // Trigger resize after animation
            self.trigger('resize');
          }
          sectionsIsTransitioning = false;
          scoreBar.setScore(0);
        }, 150);

        if ($wrapper) {
          $wrapper.find('.h5p-question-feedback-tail').remove();
        }
      }

      return self;
    };

    /**
     * Set feedback message.
     *
     * @param {string} [content]
     * @param {number} score The score
     * @param {number} maxScore The maximum score for this question
     * @param {string} [scoreBarLabel] Makes it easier for readspeakers to identify the scorebar
     * @param {string} [helpText] Help text that describes the score inside a tip icon
     * @param {object} [popupSettings] Extra settings for popup feedback
     * @param {boolean} [popupSettings.showAsPopup] Should the feedback display as popup?
     * @param {string} [popupSettings.closeText] Translation for close button text
     * @param {object} [popupSettings.click] Element representing where user clicked on screen
     */
    self.setFeedback = function (content, score, maxScore, scoreBarLabel, helpText, popupSettings, scoreExplanationButtonLabel) {
      // Feedback is disabled
      if (behaviour.disableFeedback) {
        return self;
      }

      // Need to toggle buttons right away to avoid flickering/blinking
      // Note: This means content types should invoke hide/showButton before setFeedback
      toggleButtons();

      clickElement = (popupSettings != null && popupSettings.click != null ? popupSettings.click : null);
      clearTimeout(feedbackTransitionTimer);

      var $feedback = $('<div>', {
        'class': 'h5p-question-feedback-container'
      });

      var $feedbackContent = $('<div>', {
        'class': 'h5p-question-feedback-content'
      }).appendTo($feedback);

      // Feedback text
      $('<div>', {
        'class': 'h5p-question-feedback-content-text',
        'html': content
      }).appendTo($feedbackContent);

      var $scorebar = $('<div>', {
        'class': 'h5p-question-scorebar-container'
      });
      if (scoreBar === undefined) {
        scoreBar = JoubelUI.createScoreBar(maxScore, scoreBarLabel, helpText, scoreExplanationButtonLabel);
      }
      scoreBar.appendTo($scorebar);

      $feedbackContent.toggleClass('has-content', content !== undefined && content.length > 0);

      // Feedback for readspeakers
      if (!behaviour.disableReadSpeaker && scoreBarLabel) {
        self.read(scoreBarLabel.replace(':num', score).replace(':total', maxScore) + '. ' + (content ? content : ''));
      }

      showFeedback = true;
      if (sections.feedback) {
        // Update section
        update('feedback', $feedback);
        update('scorebar', $scorebar);
      }
      else {
        // Create section
        register('feedback', $feedback);
        register('scorebar', $scorebar);
        if (initialized && $wrapper) {
          insert(self.order, 'feedback', sections, $wrapper);
          insert(self.order, 'scorebar', sections, $wrapper);
        }
      }

      showSection(sections.feedback);
      showSection(sections.scorebar);

      resizeButtons();

      if (popupSettings != null && popupSettings.showAsPopup == true) {
        makeFeedbackPopup(popupSettings.closeText);
        scoreBar.setScore(score);
      }
      else {
        // Show feedback section
        feedbackTransitionTimer = setTimeout(function () {
          setElementHeight(sections.feedback.$element);
          setElementHeight(sections.scorebar.$element);
          sectionsIsTransitioning = true;

          // Scroll to bottom after showing feedback
          scrollToBottom();

          // Trigger resize after animation
          feedbackTransitionTimer = setTimeout(function () {
            sectionsIsTransitioning = false;
            self.trigger('resize');
            scoreBar.setScore(score);
          }, 150);
        }, 0);
      }

      return self;
    };

    /**
     * Set feedback content (no animation).
     *
     * @param {string} content
     * @param {boolean} [extendContent] True will extend content, instead of replacing it
     */
    self.updateFeedbackContent = function (content, extendContent) {
      if (sections.feedback && sections.feedback.$element) {

        if (extendContent) {
          content = $('.h5p-question-feedback-content', sections.feedback.$element).html() + ' ' + content;
        }

        // Update feedback content html
        $('.h5p-question-feedback-content', sections.feedback.$element).html(content).addClass('has-content');

        // Make sure the height is correct
        setElementHeight(sections.feedback.$element);

        // Need to trigger resize when feedback has finished transitioning
        setTimeout(self.trigger.bind(self, 'resize'), 150);
      }

      return self;
    };

    /**
     * Set the content of the explanation / feedback panel
     *
     * @param {Object} data
     * @param {string} data.correct
     * @param {string} data.wrong
     * @param {string} data.text
     * @param {string} title Title for explanation panel
     *
     * @return {H5P.Question}
     */
    self.setExplanation = function (data, title) {
      if (data) {
        var explainer = new H5P.Question.Explainer(title, data);

        if (sections.explanation) {
          // Update section
          update('explanation', explainer.getElement());
        }
        else {
          register('explanation', explainer.getElement());

          if (initialized && $wrapper) {
            insert(self.order, 'explanation', sections, $wrapper);
          }
        }
      }
      else if (sections.explanation) {
        // Hide explanation section
        sections.explanation.$element.children().detach();
      }

      return self;
    };

    /**
     * Checks to see if button is registered.
     *
     * @param {string} id
     * @returns {boolean}
     */
    self.hasButton = function (id) {
      return (buttons[id] !== undefined);
    };

    /**
     * @typedef {Object} ConfirmationDialog
     * @property {boolean} [enable] Must be true to show confirmation dialog
     * @property {Object} [instance] Instance that uses confirmation dialog
     * @property {jQuery} [$parentElement] Append to this element.
     * @property {Object} [l10n] Translatable fields
     * @property {string} [l10n.header] Header text
     * @property {string} [l10n.body] Body text
     * @property {string} [l10n.cancelLabel]
     * @property {string} [l10n.confirmLabel]
     */

    /**
     * Register buttons for the task.
     *
     * @param {string} id
     * @param {string} text label
     * @param {function} clicked
     * @param {boolean} [visible=true]
     * @param {Object} [options] Options for button
     * @param {Object} [extras] Extra options
     * @param {ConfirmationDialog} [extras.confirmationDialog] Confirmation dialog
     * @param {Object} [extras.contentData] Content data
     * @params {string} [extras.textIfSubmitting] Text to display if submitting
     */
    self.addButton = function (id, text, clicked, visible, options, extras) {
      if (buttons[id]) {
        return self; // Already registered
      }

      if (sections.buttons === undefined)  {
        // We have buttons, register wrapper
        register('buttons');
        if (initialized) {
          insert(self.order, 'buttons', sections, $wrapper);
        }
      }

      extras = extras || {};
      extras.confirmationDialog = extras.confirmationDialog || {};
      options = options || {};

      var confirmationDialog =
        self.addConfirmationDialogToButton(extras.confirmationDialog, clicked);

      /**
       * Handle button clicks through both mouse and keyboard
       * @private
       */
      var handleButtonClick = function () {
        if (extras.confirmationDialog.enable && confirmationDialog) {
          // Show popups section if used
          if (!extras.confirmationDialog.$parentElement) {
            sections.popups.$element.removeClass('hidden');
          }
          confirmationDialog.show($e.position().top);
        }
        else {
          clicked();
        }
      };

      const isSubmitting = extras.contentData && extras.contentData.standalone
        && (extras.contentData.isScoringEnabled || extras.contentData.isReportingEnabled);

      if (isSubmitting && extras.textIfSubmitting) {
        text = extras.textIfSubmitting;
      }

      buttons[id] = {
        isTruncated: false,
        text: text,
        isVisible: false,
        ariaLabel: options['aria-label']
      };

      // The button might be <button> or <a>
      // (dependent on options.href set or not)
      var isAnchorTag = (options.href !== undefined);
      var $e = buttons[id].$element = JoubelUI.createButton($.extend({
        'class': 'h5p-question-' + id,
        html: text,
        on: {
          click: function (event) {
            handleButtonClick();
            if (isAnchorTag) {
              event.preventDefault();
            }
          }
        }
      }, options));
      buttonOrder.push(id);

      H5P.Tooltip($e.get(0), {tooltipSource: 'data-tooltip'});

      // The button might be <button> or <a>. If <a>, the space key is not
      // triggering the click event, must therefore handle this here:
      if (isAnchorTag) {
        $e.on('keypress', function (event) {
          if (event.which === 32) { // Space
            handleButtonClick();
            event.preventDefault();
          }
        });
      }

      if (visible === undefined || visible) {
        // Button should be visible
        $e.appendTo(sections.buttons.$element);
        buttons[id].isVisible = true;
        showSection(sections.buttons);
      }

      return self;
    };

    var setButtonWidth = function (button) {
      var $button = button.$element;
      var $tmp = $button.clone()
        .css({
          'position': 'absolute',
          'white-space': 'nowrap',
          'max-width': 'none'
        }).removeClass('truncated')
        .html(button.text)
        .appendTo($button.parent());

      // Calculate max width (button including text)
      button.width = {
        max: Math.ceil($tmp.outerWidth() + parseFloat($tmp.css('margin-left')) + parseFloat($tmp.css('margin-right')))
      };

      // Calculate min width (truncated, icon only)
      $tmp.html('').addClass('truncated');
      button.width.min = Math.ceil($tmp.outerWidth() + parseFloat($tmp.css('margin-left')) + parseFloat($tmp.css('margin-right')));
      $tmp.remove();
    };

    /**
     * Add confirmation dialog to button
     * @param {ConfirmationDialog} options
     *  A confirmation dialog that will be shown before click handler of button
     *  is triggered
     * @param {function} clicked
     *  Click handler of button
     * @return {H5P.ConfirmationDialog|undefined}
     *  Confirmation dialog if enabled
     */
    self.addConfirmationDialogToButton = function (options, clicked) {
      options = options || {};

      if (!options.enable) {
        return;
      }

      // Confirmation dialog
      var confirmationDialog = new H5P.ConfirmationDialog({
        instance: options.instance,
        headerText: options.l10n.header,
        dialogText: options.l10n.body,
        cancelText: options.l10n.cancelLabel,
        confirmText: options.l10n.confirmLabel
      });

      // Determine parent element
      if (options.$parentElement) {
        const parentElement = options.$parentElement.get(0);
        let dialogParent;
        // If using h5p-content, dialog will not appear on embedded fullscreen
        if (parentElement.classList.contains('h5p-content')) {
          dialogParent = parentElement.querySelector('.h5p-container');
        }

        confirmationDialog.appendTo(dialogParent ?? parentElement);
      }
      else {

        // Create popup section and append to that
        if (sections.popups === undefined) {
          register('popups');
          if (initialized) {
            insert(self.order, 'popups', sections, $wrapper);
          }
          sections.popups.$element.addClass('hidden');
          self.order.push('popups');
        }
        confirmationDialog.appendTo(sections.popups.$element.get(0));
      }

      // Add event listeners
      confirmationDialog.on('confirmed', function () {
        if (!options.$parentElement) {
          sections.popups.$element.addClass('hidden');
        }
        clicked();

        // Trigger to content type
        self.trigger('confirmed');
      });

      confirmationDialog.on('canceled', function () {
        if (!options.$parentElement) {
          sections.popups.$element.addClass('hidden');
        }
        // Trigger to content type
        self.trigger('canceled');
      });

      return confirmationDialog;
    };

    /**
     * Show registered button with given identifier.
     *
     * @param {string} id
     * @param {Number} [priority]
     */
    self.showButton = function (id, priority) {
      var aboutToBeHidden = existsInArray(id, 'id', buttonsToHide) !== -1;
      if (buttons[id] === undefined || (buttons[id].isVisible === true && !aboutToBeHidden)) {
        return self;
      }

      priority = priority || 0;

      // Skip if already being shown
      var indexToShow = existsInArray(id, 'id', buttonsToShow);
      if (indexToShow !== -1) {

        // Update priority
        if (buttonsToShow[indexToShow].priority < priority) {
          buttonsToShow[indexToShow].priority = priority;
        }

        return self;
      }

      // Check if button is going to be hidden on next tick
      var exists = existsInArray(id, 'id', buttonsToHide);
      if (exists !== -1) {

        // Skip hiding if higher priority
        if (buttonsToHide[exists].priority <= priority) {
          buttonsToHide.splice(exists, 1);
          buttonsToShow.push({id: id, priority: priority});
        }

      } // If button is not shown
      else if (!buttons[id].$element.is(':visible')) {

        // Show button on next tick
        buttonsToShow.push({id: id, priority: priority});
      }

      if (!toggleButtonsTimer) {
        toggleButtonsTimer = setTimeout(toggleButtons, 0);
      }

      return self;
    };

    /**
     * Hide registered button with given identifier.
     *
     * @param {string} id
     * @param {number} [priority]
     */
    self.hideButton = function (id, priority) {
      var aboutToBeShown = existsInArray(id, 'id', buttonsToShow) !== -1;
      if (buttons[id] === undefined || (buttons[id].isVisible === false && !aboutToBeShown)) {
        return self;
      }

      priority = priority || 0;

      // Skip if already being hidden
      var indexToHide = existsInArray(id, 'id', buttonsToHide);
      if (indexToHide !== -1) {

        // Update priority
        if (buttonsToHide[indexToHide].priority < priority) {
          buttonsToHide[indexToHide].priority = priority;
        }

        return self;
      }

      // Check if buttons is going to be shown on next tick
      var exists = existsInArray(id, 'id', buttonsToShow);
      if (exists !== -1) {

        // Skip showing if higher priority
        if (buttonsToShow[exists].priority <= priority) {
          buttonsToShow.splice(exists, 1);
          buttonsToHide.push({id: id, priority: priority});
        }
      }
      else if (!buttons[id].$element.is(':visible')) {

        // Make sure it is detached in case the container is hidden.
        hideButton(id);
      }
      else {

        // Hide button on next tick.
        buttonsToHide.push({id: id, priority: priority});
      }

      if (!toggleButtonsTimer) {
        toggleButtonsTimer = setTimeout(toggleButtons, 0);
      }

      return self;
    };

    /**
     * Set focus to the given button. If no button is given the first visible
     * button gets focused. This is useful if you lose focus.
     *
     * @param {string} [id]
     */
    self.focusButton = function (id) {
      if (id === undefined) {
        // Find first button that is visible.
        for (var i = 0; i < buttonOrder.length; i++) {
          var button = buttons[buttonOrder[i]];
          if (button && button.isVisible) {
            // Give that button focus
            button.$element.focus();
            break;
          }
        }
      }
      else if (buttons[id] && buttons[id].$element.is(':visible')) {
        // Set focus to requested button
        buttons[id].$element.focus();
      }

      return self;
    };

    /**
     * Toggle readspeaker functionality
     * @param {boolean} [disable] True to disable, false to enable.
     */
    self.toggleReadSpeaker = function (disable) {
      behaviour.disableReadSpeaker = disable || !behaviour.disableReadSpeaker;
    };

    /**
     * Set new element for section.
     *
     * @param {String} id
     * @param {H5P.jQuery} $element
     */
    self.insertSectionAtElement = function (id, $element) {
      if (sections[id] === undefined) {
        register(id);
      }
      sections[id].parent = $element;

      // Insert section if question is not initialized
      if (!initialized) {
        insert([id], id, sections, $element);
      }

      return self;
    };

    /**
     * Attach content to given container.
     *
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      if (self.isRoot()) {
        self.setActivityStarted();
      }

      // The first time we attach we also create our DOM elements.
      if ($wrapper === undefined) {
        if (self.registerDomElements !== undefined &&
           (self.registerDomElements instanceof Function ||
           typeof self.registerDomElements === 'function')) {

          // Give the question type a chance to register before attaching
          self.registerDomElements();
        }

        // Create section for reading messages
        $read = $('<div/>', {
          'aria-live': 'polite',
          'class': 'h5p-hidden-read'
        });
        register('read', $read);
        self.trigger('registerDomElements');
      }

      // Prepare container
      $wrapper = $container;
      $container.html('')
        .addClass('h5p-question h5p-' + type);

      // Add sections in given order
      var $sections = [];
      for (var i = 0; i < self.order.length; i++) {
        var section = self.order[i];
        if (sections[section]) {
          if (sections[section].parent) {
            // Section has a different parent
            sections[section].$element.appendTo(sections[section].parent);
          }
          else {
            $sections.push(sections[section].$element);
          }
          sections[section].isVisible = true;
        }
      }

      // Only append once to DOM for optimal performance
      $container.append($sections);

      // Let others react to dom changes
      self.trigger('domChanged', {
        '$target': $container,
        'library': self.libraryInfo.machineName,
        'contentId': self.contentId,
        'key': 'newLibrary'
      }, {'bubbles': true, 'external': true});

      // ??
      initialized = true;

      return self;
    };

    /**
     * Detach all sections from their parents
     */
    self.detachSections = function () {
      // Deinit Question
      initialized = false;

      // Detach sections
      for (var section in sections) {
        sections[section].$element.detach();
      }

      return self;
    };

    // Listen for resize
    self.on('resize', function () {
      // Allow elements to attach and set their height before resizing
      if (!sectionsIsTransitioning && sections.feedback && showFeedback) {
        // Resize feedback to fit
        setElementHeight(sections.feedback.$element);
      }

      // Re-position feedback popup if in use
      var $element = sections.feedback;
      var $click = clickElement;

      if ($element != null && $element.$element != null && $click != null && $click.$element != null) {
        setTimeout(function () {
          positionFeedbackPopup($element.$element, $click.$element);
        }, 10);
      }

      resizeButtons();
    });
  }

  // Inheritance
  Question.prototype = Object.create(EventDispatcher.prototype);
  Question.prototype.constructor = Question;

  /**
   * Determine the overall feedback to display for the question.
   * Returns empty string if no matching range is found.
   *
   * @param {Object[]} feedbacks
   * @param {number} scoreRatio
   * @return {string}
   */
  Question.determineOverallFeedback = function (feedbacks, scoreRatio) {
    scoreRatio = Math.floor(scoreRatio * 100);

    for (var i = 0; i < feedbacks.length; i++) {
      var feedback = feedbacks[i];
      var hasFeedback = (feedback.feedback !== undefined && feedback.feedback.trim().length !== 0);

      if (feedback.from <= scoreRatio && feedback.to >= scoreRatio && hasFeedback) {
        return feedback.feedback;
      }
    }

    return '';
  };

  return Question;
})(H5P.jQuery, H5P.EventDispatcher, H5P.JoubelUI);
;
H5P.Question.Explainer = (function ($) {
  /**
   * Constructor
   *
   * @class
   * @param {string} title
   * @param {array} explanations
   */
  function Explainer(title, explanations) {
    var self = this;

    /**
     * Create the DOM structure
     */
    var createHTML = function () {
      self.$explanation = $('<div>', {
        'class': 'h5p-question-explanation-container'
      });

      // Add title:
      $('<div>', {
        'class': 'h5p-question-explanation-title',
        role: 'heading',
        html: title,
        appendTo: self.$explanation
      });

      var $explanationList = $('<ul>', {
        'class': 'h5p-question-explanation-list',
        appendTo: self.$explanation
      });

      for (var i = 0; i < explanations.length; i++) {
        var feedback = explanations[i];
        var $explanationItem = $('<li>', {
          'class': 'h5p-question-explanation-item',
          appendTo: $explanationList
        });

        var $content = $('<div>', {
          'class': 'h5p-question-explanation-status'
        });

        if (feedback.correct) {
          $('<span>', {
            'class': 'h5p-question-explanation-correct',
            html: feedback.correct,
            appendTo: $content
          });
        }
        if (feedback.wrong) {
          $('<span>', {
            'class': 'h5p-question-explanation-wrong',
            html: feedback.wrong,
            appendTo: $content
          });
        }
        $content.appendTo($explanationItem);

        if (feedback.text) {
          $('<div>', {
            'class': 'h5p-question-explanation-text',
            html: feedback.text,
            appendTo: $explanationItem
          });
        }
      }
    };

    createHTML();

    /**
     * Return the container HTMLElement
     *
     * @return {HTMLElement}
     */
    self.getElement = function () {
      return self.$explanation;
    };
  }

  return Explainer;

})(H5P.jQuery);
;
(function (Question) {

  /**
   * Makes it easy to add animated score points for your question type.
   *
   * @class H5P.Question.ScorePoints
   */
  Question.ScorePoints = function () {
    var self = this;

    var elements = [];
    var showElementsTimer;

    /**
     * Create the element that displays the score point element for questions.
     *
     * @param {boolean} isCorrect
     * @return {HTMLElement}
     */
    self.getElement = function (isCorrect) {
      var element = document.createElement('div');
      element.classList.add(isCorrect ? 'h5p-question-plus-one' : 'h5p-question-minus-one');
      element.classList.add('h5p-question-hidden-one');
      elements.push(element);

      // Schedule display animation of all added elements
      if (showElementsTimer) {
        clearTimeout(showElementsTimer);
      }
      showElementsTimer = setTimeout(showElements, 0);

      return element;
    };

    /**
     * @private
     */
    var showElements = function () {
      // Determine delay between triggering animations
      var delay = 0;
      var increment = 150;
      var maxTime = 1000;

      if (elements.length && elements.length > Math.ceil(maxTime / increment)) {
        // Animations will run for more than ~1 second, reduce it.
        increment = maxTime / elements.length;
      }

      for (var i = 0; i < elements.length; i++) {
        // Use timer to trigger show
        setTimeout(showElement(elements[i]), delay);

        // Increse delay for next element
        delay += increment;
      }
    };

    /**
     * Trigger transition animation for the given element
     *
     * @private
     * @param {HTMLElement} element
     * @return {function}
     */
    var showElement = function (element) {
      return function () {
        element.classList.remove('h5p-question-hidden-one');
      };
    };
  };

})(H5P.Question);
;
(()=>{var e={97:(e,t,r)=>{"use strict";r.d(t,{A:()=>Y});var n=function(e){var t=e.length;return function r(){var n=Array.prototype.slice.call(arguments,0);return n.length>=t?e.apply(null,n):function(){var e=Array.prototype.slice.call(arguments,0);return r.apply(null,n.concat(e))}}},o=function(e,t){return t.substr(0,1)===e},a=function(e,t){return t.substr(-1)===e},i=n((function(e,t){return o(e,t)&&(t=t.slice(1)),a(e,t)&&(t=t.slice(0,-1)),t}));const s={curry:n,cleanCharacter:i,startsWith:o,endsWith:a,shuffle:function(e){for(var t=e.length;t>0;){var r=Math.floor(Math.random()*t),n=e[--t];e[t]=e[r],e[r]=n}return e},createElementWithTextPart:function(e){var t=document.createElement("span");return t.innerHTML=e,t}};var l=function(e){return e.split(/(\*.*?\*)/).filter((function(e){return e.length>0}))},h=function(e){var t=e.match(/(:([^\\*]+))/g),r=e.match(/(\\\+([^\\*:]+))/g),n=e.match(/(\\\-([^\\*:]+))/g),o=s.cleanCharacter("*",e);return t&&(o=o.replace(t,""),t=(t=t[0].replace(":","")).replace(/\s+$/,"")),r&&(o=o.replace(r,""),r=(r=r[0].replace("\\+","")).replace(/\s+$/,"")),n&&(o=o.replace(n,""),n=(n=n[0].replace("\\-","")).replace(/\s+$/,"")),{tip:t,correctFeedback:r,incorrectFeedback:n,text:o=o.replace(/\s+$/,"")}},c=c||{};c.DragText=c.DragText||{},c.DragText.StopWatch=function(){function e(){this.duration=0}return e.prototype.start=function(){return this.startTime=Date.now(),this},e.prototype.stop=function(){return this.duration=this.duration+Date.now()-this.startTime,this.passedTime()},e.prototype.reset=function(){this.duration=0,this.startTime=Date.now()},e.prototype.passedTime=function(){return Math.round(this.duration/10)/100},e}();const p=c.DragText.StopWatch;var d=function(e){return e.stopPropagation()};H5P.TextDraggable=function(e){var t="h5p-drag-dropped";function r(t,r,n){H5P.EventDispatcher.call(this);var o=this;o.text=t,o.insideDropzone=null,o.$draggable=e(r),o.$ariaLabel=o.$draggable.find(".h5p-hidden-read"),o.index=n,o.initialIndex=n,o.shortFormat=o.text,o.shortFormat.length>20&&!o.shortFormat.match(/\\\(.+\\\)|\\\[.+\\\]|\$\$.+\$\$/)&&(o.shortFormat=o.shortFormat.slice(0,17)+"..."),o.$draggable.on("touchstart",d),o.$draggable.on("touchmove",d),o.$draggable.on("touchend",d)}return r.prototype=Object.create(H5P.EventDispatcher.prototype),r.prototype.constructor=r,r.prototype.getIndex=function(){return this.index},r.prototype.setIndex=function(e){return this.index=e,this},r.prototype.getInitialIndex=function(){return this.initialIndex},r.prototype.hasInitialIndex=function(e){return this.initialIndex===e},r.prototype.appendDraggableTo=function(e){var t=this.$draggable[0]===document.activeElement;this.$draggable.detach().css({left:0,top:0}).appendTo(e),t&&this.$draggable.focus()},r.prototype.revertDraggableTo=function(e){var t=this.$draggable.offset().left-e.offset().left,r=this.$draggable.offset().top-e.offset().top;this.$draggable.detach().prependTo(e).css({left:t,top:r}).animate({left:0,top:0})},r.prototype.toggleDroppedFeedback=function(e){e?this.$draggable.addClass(t):this.$draggable.removeClass(t)},r.prototype.disableDraggable=function(){this.$draggable.draggable({disabled:!0})},r.prototype.enableDraggable=function(){this.$draggable.draggable({disabled:!1})},r.prototype.getDraggableElement=function(){return this.$draggable},r.prototype.updateAriaLabel=function(e){this.$ariaLabel.html(e)},r.prototype.updateAriaDescription=function(e){this.$draggable.attr("aria-description",e)},r.prototype.getElement=function(){return this.$draggable.get(0)},r.prototype.removeFromZone=function(){var e=this.insideDropzone;return null!==this.insideDropzone&&(this.insideDropzone.removeFeedback(),this.insideDropzone.removeDraggable()),this.toggleDroppedFeedback(!1),this.removeShortFormat(),this.updateAriaDescription(""),this.insideDropzone=null,e},r.prototype.addToZone=function(e){null!==this.insideDropzone&&this.insideDropzone.removeDraggable(),this.toggleDroppedFeedback(!0),this.insideDropzone=e,this.setShortFormat(),this.trigger("addedToZone")},r.prototype.getAnswerText=function(){return this.text},r.prototype.setShortFormat=function(){this.$draggable.html(this.shortFormat)},r.prototype.getShortFormat=function(){return this.shortFormat},r.prototype.removeShortFormat=function(){this.$draggable.html(this.text)},r.prototype.getInsideDropzone=function(){return this.insideDropzone},r.prototype.isInsideDropZone=function(){return!!this.insideDropzone},r}(H5P.jQuery);const g=H5P.TextDraggable;H5P.TextDroppable=function(e){var t="h5p-drag-correct-feedback",r="h5p-drag-wrong-feedback",n="h5p-drag-draggable-correct",o="h5p-drag-draggable-wrong";function a(t,r,n,o,a,i,s,l){var h=this;h.text=t,h.tip=r,h.correctFeedback=n,h.incorrectFeedback=o,h.index=s,h.params=l,h.containedDraggable=null,h.$dropzone=e(a),h.$dropzoneContainer=e(i),h.tip&&(h.$tip=H5P.JoubelUI.createTip(h.tip,{tipLabel:h.params.tipLabel,tabcontrol:!0}),h.$dropzoneContainer.append(h.$tip),h.$dropzone.focus((function(){return h.$tip.attr("tabindex","0")})),h.$dropzone.blur((function(){return h.removeTipTabIndexIfNoFocus()})),h.$tip.blur((function(){return h.removeTipTabIndexIfNoFocus()}))),h.$incorrectText=e("<div/>",{html:h.params.incorrectText+" "+h.params.correctAnswer,class:"correct-answer"}),h.$correctText=e("<div/>",{html:h.params.correctText,class:"correct-answer"}),h.$showSolution=e("<div/>",{class:"h5p-drag-show-solution-container"}).appendTo(h.$dropzoneContainer).hide()}return a.prototype.removeTipTabIndexIfNoFocus=function(){var e=this;setTimeout((function(){e.$dropzone.is(":focus")||e.$tip.is(":focus")||e.$tip.attr("tabindex","-1")}),0)},a.prototype.showSolution=function(){var e=null!==this.containedDraggable&&this.containedDraggable.getAnswerText()===this.text;e||this.$showSolution.html(this.text),this.$showSolution.prepend(e?this.$correctText:this.$incorrectText),this.$showSolution.toggleClass("incorrect",!e),this.$showSolution.show()},a.prototype.hideSolution=function(){this.$showSolution.html(""),this.$showSolution.hide()},a.prototype.getElement=function(){return this.$dropzone.get(0)},a.prototype.appendDroppableTo=function(e){this.$dropzoneContainer.appendTo(e)},a.prototype.appendInsideDroppableTo=function(e){if(null!==this.containedDraggable)return this.containedDraggable.revertDraggableTo(e),this.containedDraggable},a.prototype.setDraggable=function(e){var t=this;t.containedDraggable!==e&&(null!==t.containedDraggable&&t.containedDraggable.removeFromZone(),t.containedDraggable=e,e.addToZone(t))},a.prototype.hasDraggable=function(){return!!this.containedDraggable},a.prototype.removeDraggable=function(){null!==this.containedDraggable&&(this.containedDraggable=null)},a.prototype.isCorrect=function(){return null!==this.containedDraggable&&this.containedDraggable.getAnswerText()===this.text},a.prototype.addFeedback=function(){this.isCorrect()?(this.$dropzone.removeClass(r).addClass(t),this.containedDraggable.getDraggableElement().removeClass(o).addClass(n)):null===this.containedDraggable?this.$dropzone.removeClass(r).removeClass(t):(this.$dropzone.removeClass(t).addClass(r),null!==this.containedDraggable&&this.containedDraggable.getDraggableElement().addClass(o).removeClass(n))},a.prototype.removeFeedback=function(){this.$dropzone.removeClass(r).removeClass(t),null!==this.containedDraggable&&this.containedDraggable.getDraggableElement().removeClass(o).removeClass(n)},a.prototype.hasFeedback=function(){return this.$dropzone.hasClass(r)||this.$dropzone.hasClass(t)},a.prototype.setShortFormat=function(){null!==this.containedDraggable&&this.containedDraggable.setShortFormat()},a.prototype.disableDropzoneAndContainedDraggable=function(){null!==this.containedDraggable&&this.containedDraggable.disableDraggable(),this.$dropzone.droppable({disabled:!0})},a.prototype.enableDropzone=function(){this.$dropzone.droppable({disabled:!1})},a.prototype.removeShortFormat=function(){null!==this.containedDraggable&&this.containedDraggable.removeShortFormat()},a.prototype.getDropzone=function(){return this.$dropzone},a.prototype.getIndex=function(){return this.index},a}(H5P.jQuery);const u=H5P.TextDroppable,b=function(e){const t=e.length;return function r(){const n=Array.prototype.slice.call(arguments,0);return n.length>=t?e.apply(null,n):function(){const e=Array.prototype.slice.call(arguments,0);return r.apply(null,n.concat(e))}}},m=(...e)=>e.reduce(((e,t)=>(...r)=>e(t(...r)))),f=b((function(e,t){t.forEach(e)})),v=(b((function(e,t){return t.map(e)})),b((function(e,t){return t.filter(e)}))),D=b((function(e,t){return t.some(e)})),y=b((function(e,t){return-1!=t.indexOf(e)})),E=b((function(e,t){return v((t=>!y(t,e)),t)})),w=b(((e,t)=>t.getAttribute(e))),x=b(((e,t,r)=>r.setAttribute(e,t))),T=b(((e,t)=>t.removeAttribute(e))),C=b(((e,t)=>t.hasAttribute(e))),A=b(((e,t,r)=>r.getAttribute(e)===t)),k=(b(((e,t)=>{const r=w(e,t);x(e,("true"!==r).toString(),t)})),b(((e,t)=>e.appendChild(t))),b(((e,t)=>t.querySelector(e))),b(((e,t)=>{return r=t.querySelectorAll(e),Array.prototype.slice.call(r);var r})),b(((e,t)=>e.removeChild(t))),b(((e,t)=>t.classList.contains(e))),b(((e,t)=>t.classList.add(e)))),F=b(((e,t)=>t.classList.remove(e))),$=k("hidden"),S=F("hidden"),I=(b(((e,t)=>(e?S:$)(t))),b(((e,t,r)=>{r.classList[t?"add":"remove"](e)})),T("tabindex")),z=(f(I),x("tabindex","0")),P=x("tabindex","-1"),B=C("tabindex");class L{constructor(e){Object.assign(this,{listeners:{},on:function(e,t,r){const n={listener:t,scope:r};return this.listeners[e]=this.listeners[e]||[],this.listeners[e].push(n),this},fire:function(e,t){return(this.listeners[e]||[]).every((function(e){return!1!==e.listener.call(e.scope||this,t)}))},propagate:function(e,t){let r=this;e.forEach((e=>t.on(e,(t=>r.fire(e,t)))))}}),this.plugins=e||[],this.elements=[],this.negativeTabIndexAllowed=!1,this.on("nextElement",this.nextElement,this),this.on("previousElement",this.previousElement,this),this.on("firstElement",this.firstElement,this),this.on("lastElement",this.lastElement,this),this.initPlugins()}addElement(e){this.elements.push(e),this.firesEvent("addElement",e),1===this.elements.length&&this.setTabbable(e)}insertElementAt(e,t){this.elements.splice(t,0,e),this.firesEvent("addElement",e),1===this.elements.length&&this.setTabbable(e)}removeElement(e){this.elements=E([e],this.elements),B(e)&&(this.setUntabbable(e),this.elements[0]&&this.setTabbable(this.elements[0])),this.firesEvent("removeElement",e)}count(){return this.elements.length}firesEvent(e,t){const r=this.elements.indexOf(t);return this.fire(e,{element:t,index:r,elements:this.elements,oldElement:this.tabbableElement})}nextElement({index:e}){const t=e===this.elements.length-1,r=this.elements[t?0:e+1];this.setTabbable(r),r.focus()}firstElement(){const e=this.elements[0];this.setTabbable(e),e.focus()}lastElement(){const e=this.elements[this.elements.length-1];this.setTabbable(e),e.focus()}setTabbableByIndex(e){const t=this.elements[e];t&&this.setTabbable(t)}setTabbable(e){f(this.setUntabbable.bind(this),this.elements),z(e),this.tabbableElement=e}setUntabbable(e){e!==document.activeElement&&(this.negativeTabIndexAllowed?P(e):I(e))}previousElement({index:e}){const t=0===e,r=this.elements[t?this.elements.length-1:e-1];this.setTabbable(r),r.focus()}useNegativeTabIndex(){this.negativeTabIndexAllowed=!0,this.elements.forEach((e=>{e.hasAttribute("tabindex")||P(e)}))}initPlugins(){this.plugins.forEach((function(e){void 0!==e.init&&e.init(this)}),this)}}const H="aria-grabbed",_=x(H),Z=A(H,"true"),W=v(C(H)),R=m(f(x(H,"false")),W),O=m(D(Z),W);class N{init(e){this.controls=e,this.controls.on("select",this.select,this)}addElement(e){_("false",e),this.controls.addElement(e)}setAllGrabbedToFalse(){R(this.controls.elements)}hasAnyGrabbed(){return O(this.controls.elements)}select({element:e}){const t=Z(e);this.setAllGrabbedToFalse(),t||_("true",e)}}const j="aria-dropeffect",K=x(j,"none"),M=x(j,"move"),X=v(C(j)),Q=m(f(M),X),U=m(f(K),X);class V{init(e){this.controls=e}setAllToMove(){Q(this.controls.elements)}setAllToNone(){U(this.controls.elements)}}V.DropEffect={COPY:"copy",MOVE:"move",EXECUTE:"execute",POPUP:"popup",NONE:"none"};class G{constructor(){this.selectability=!0}init(e){this.boundHandleKeyDown=this.handleKeyDown.bind(this),this.controls=e,this.controls.on("addElement",this.listenForKeyDown,this),this.controls.on("removeElement",this.removeKeyDownListener,this)}listenForKeyDown({element:e}){e.addEventListener("keydown",this.boundHandleKeyDown)}removeKeyDownListener({element:e}){e.removeEventListener("keydown",this.boundHandleKeyDown)}handleKeyDown(e){switch(e.which){case 27:this.close(e.target),e.preventDefault(),e.stopPropagation();break;case 35:this.lastElement(e.target),e.preventDefault(),e.stopPropagation();break;case 36:this.firstElement(e.target),e.preventDefault(),e.stopPropagation();break;case 13:case 32:this.select(e.target),e.preventDefault(),e.stopPropagation();break;case 37:case 38:this.hasChromevoxModifiers(e)||(this.previousElement(e.target),e.preventDefault(),e.stopPropagation());break;case 39:case 40:this.hasChromevoxModifiers(e)||(this.nextElement(e.target),e.preventDefault(),e.stopPropagation())}}hasChromevoxModifiers(e){return e.shiftKey||e.ctrlKey}previousElement(e){!1!==this.controls.firesEvent("beforePreviousElement",e)&&(this.controls.firesEvent("previousElement",e),this.controls.firesEvent("afterPreviousElement",e))}nextElement(e){!1!==this.controls.firesEvent("beforeNextElement",e)&&(this.controls.firesEvent("nextElement",e),this.controls.firesEvent("afterNextElement",e))}select(e){this.selectability&&!1!==this.controls.firesEvent("before-select",e)&&(this.controls.firesEvent("select",e),this.controls.firesEvent("after-select",e))}firstElement(e){!1!==this.controls.firesEvent("beforeFirstElement",e)&&(this.controls.firesEvent("firstElement",e),this.controls.firesEvent("afterFirstElement",e))}lastElement(e){!1!==this.controls.firesEvent("beforeLastElement",e)&&(this.controls.firesEvent("lastElement",e),this.controls.firesEvent("afterLastElement",e))}disableSelectability(){this.selectability=!1}enableSelectability(){this.selectability=!0}close(e){!1!==this.controls.firesEvent("before-close",e)&&(this.controls.firesEvent("close",e),this.controls.firesEvent("after-close",e))}}class q{constructor(){this.selectability=!0,this.handleClickBound=this.handleClick.bind(this),this.handleDragBound=this.handleDrag.bind(this)}init(e){this.controls=e,this.controls.on("addElement",this.listenForKeyDown,this),this.controls.on("removeElement",this.unlistenForKeyDown,this)}listenForKeyDown({element:e}){e.addEventListener("click",this.handleClickBound),e.addEventListener("drag",this.handleClickBound)}unlistenForKeyDown({element:e}){e.removeEventListener("click",this.handleClickBound),e.removeEventListener("drag",this.handleDragBound)}handleClick(e){this.controls.firesEvent("select",e.currentTarget)}handleDrag(e){this.controls.firesEvent("drag",e.currentTarget)}disableSelectability(){this.selectability=!1}enableSelectability(){this.selectability=!0}}H5P.DragText=function(e,t,r){var n="h5p-drag-wide-screen",o="h5p-drag-draggable-wide-screen";function a(r,n,o){var a=this;this.$=e(this),this.contentId=n,this.contentData=o,t.call(this,"drag-text"),this.params=e.extend(!0,{media:{},taskDescription:"Set in adjectives in the following sentence",textField:"This is a *nice*, *flexible* content type, which allows you to highlight all the *wonderful* words in this *exciting* sentence.\nThis is another line of *fantastic* text.",distractors:"",overallFeedback:[],checkAnswer:"Check",submitAnswer:"Submit",tryAgain:"Retry",behaviour:{enableRetry:!0,enableSolutionsButton:!0,enableCheckButton:!0,instantFeedback:!1},showSolution:"Show solution",dropZoneIndex:"Drop Zone @index.",empty:"Empty.",contains:"Drop Zone @index contains draggable @draggable.",ariaDraggableIndex:"@index of @count.",tipLabel:"Show tip",correctText:"Correct!",incorrectText:"Incorrect!",resetDropTitle:"Reset drop",resetDropDescription:"Are you sure you want to reset this drop zone?",grabbed:"Draggable is grabbed.",cancelledDragging:"Cancelled dragging.",correctAnswer:"Correct answer:",scoreBarLabel:"You got :num out of :total points",a11yCheck:"Check the answers. The responses will be marked as correct, incorrect, or unanswered.",a11yShowSolution:"Show the solution. The task will be marked with its correct solution.",a11yRetry:"Retry the task. Reset all responses and start the task over again."},r),this.contentData=o,void 0!==this.contentData&&void 0!==this.contentData.previousState&&void 0!==this.contentData.previousState.length&&(this.previousState=this.contentData.previousState),this.answered=!1,this.textFieldHtml=this.params.textField.replace(/(\r\n|\n|\r)/gm,"<br/>"),this.distractorsHtml=this.params.distractors.replace(/(\r\n|\n|\r)/gm,"<br/>"),this.introductionId="h5p-drag-text-"+n+"-introduction",this.selectedElement=void 0,this.ariaDragControls=new N,this.ariaDropControls=new V,this.dragControls=new L([new G,new q,this.ariaDragControls]),this.dragControls.useNegativeTabIndex(),this.dropControls=new L([new G,new q,this.ariaDropControls]),this.dropControls.useNegativeTabIndex(),this.dragControls.on("before-select",(function(e){return!a.isElementDisabled(e.element)})),this.dragControls.on("select",this.keyboardDraggableSelected,this),this.dropControls.on("select",this.keyboardDroppableSelected,this),this.on("start",this.addAllDroppablesToControls,this),this.on("revert",this.removeControlsFromEmptyDropZones,this),this.on("stop",(function(e){e.data.target||a.removeControlsFromDropZonesIfAllEmpty()}),this),this.on("drop",this.removeControlsFromEmptyDropZones,this),this.on("start",(function(e){var t=e.data.element,r=a.getDraggableByElement(t);a.toggleDropEffect(),t.setAttribute("aria-grabbed","true"),a.setDraggableAriaLabel(r)})),this.on("stop",(function(e){var t=e.data.element,r=a.getDraggableByElement(t);a.toggleDropEffect(),t.setAttribute("aria-grabbed","false"),a.setDraggableAriaLabel(r)})),this.on("drop",this.ariaDropControls.setAllToNone,this.ariaDropControls),this.on("drop",(function(e){this.dragControls.removeElement(e.data.element)}),this),this.on("revert",(function(e){this.dragControls.insertElementAt(e.data.element,0)}),this),this.on("drop",this.updateDroppableElement,this),this.on("revert",this.updateDroppableElement,this),this.initDragText(),this.stopWatch=new p,this.stopWatch.start(),this.on("resize",this.resize,this),this.on("revert",this.toggleDraggablesContainer,this),this.on("drop",this.toggleDraggablesContainer,this),this.on("stop",(function(e){e.data.target||a.read(a.params.cancelledDragging)})),this.params.behaviour.instantFeedback&&this.on("revert",(function(){return a.instantFeedbackEvaluation()}))}return a.prototype=Object.create(t.prototype),a.prototype.constructor=a,a.prototype.updateDroppableElement=function(e){var t=e.data.target,r=e.data.element,n=this.getDroppableByElement(t);t&&this.setDroppableLabel(t,r.textContent,n.getIndex())},a.prototype.removeControlsFromDropZonesIfAllEmpty=function(){this.anyDropZoneHasDraggable()||this.removeAllDroppablesFromControls()},a.prototype.removeControlsFromEmptyDropZones=function(){var e=this;this.droppables.filter((function(e){return!e.hasDraggable()})).map((function(e){return e.getElement()})).forEach((function(t){e.dropControls.removeElement(t)}))},a.prototype.addAllDroppablesToControls=function(){var e=this;this.dropControls.count()>0&&this.removeAllDroppablesFromControls(),this.droppables.map((function(e){return e.getElement()})).forEach((function(t){return e.dropControls.addElement(t)}))},a.prototype.removeAllDroppablesFromControls=function(){var e=this;this.droppables.map((function(e){return e.getElement()})).forEach((function(t){return e.dropControls.removeElement(t)}))},a.prototype.anyDropZoneHasDraggable=function(){return this.droppables.some((function(e){return e.hasDraggable()}))},a.prototype.setDroppableLabel=function(e,t,r){this.params.dropZoneIndex.replace("@index",r.toString());var n=e.classList.contains("h5p-drag-correct-feedback"),o=e.classList.contains("h5p-drag-wrong-feedback"),a=n||o,i=e.childNodes.length>0;if(e){var s;if(a){var l,h=this.getDroppableByElement(e);l=n?h.correctFeedback?h.correctFeedback:this.params.correctText:h.incorrectFeedback?h.incorrectFeedback:this.params.incorrectText,s="".concat(this.params.contains.replace("@index",r.toString()).replace("@draggable",t)," ").concat(l,"."),h&&h.containedDraggable&&h.containedDraggable.updateAriaDescription(n?this.params.correctText:this.params.incorrectText)}else s="".concat(i?this.params.contains.replace("@index",r.toString()).replace("@draggable",t):this.params.empty.replace("@index",r.toString()));e.setAttribute("aria-label",s)}},a.prototype.registerDomElements=function(){var t=this.params.media;if(t&&t.type&&t.type.library){var r=(t=t.type).library.split(" ")[0];"H5P.Image"===r?t.params.file&&this.setImage(t.params.file.path,{disableImageZooming:this.params.media.disableImageZooming||!1,alt:t.params.alt,title:t.params.title,expandImage:t.params.expandImage,minimizeImage:t.params.minimizeImage}):"H5P.Video"===r?t.params.sources&&this.setVideo(t):"H5P.Audio"===r&&t.params.files&&this.setAudio(t)}this.$introduction=e('<p id="'+this.introductionId+'">'+this.params.taskDescription+"</p>"),this.setIntroduction(this.$introduction),this.$introduction.parent().attr("tabindex","-1"),this.setContent(this.$inner),this.addButtons()},a.prototype.initDragText=function(){return this.$inner=e("<div/>",{"aria-describedby":this.introductionId,class:"h5p-drag-inner"}),this.addTaskTo(this.$inner),this.setH5PUserState(),this.$inner},a.prototype.resize=function(){this.changeLayoutToFitWidth()},a.prototype.changeLayoutToFitWidth=function(){var e=this;if(e.addDropzoneWidth(),e.$inner.width()/parseFloat(e.$inner.css("font-size"),10)>43&&e.widestDraggable<=e.$inner.width()/3){e.$draggables.addClass(n);var t=document.activeElement;e.$wordContainer.detach().appendTo(e.$taskContainer),t!==document.activeElement&&t.focus(),e.draggables.forEach((function(e){e.getDraggableElement().addClass(o)})),e.$wordContainer.css({"margin-right":e.$draggables.width()})}else e.$wordContainer.css({"margin-right":0}),e.$draggables.removeClass(n),e.$draggables.detach().appendTo(e.$taskContainer),e.draggables.forEach((function(e){e.getDraggableElement().removeClass(o)}))},a.prototype.addButtons=function(){var e=this;e.params.behaviour.enableCheckButton&&e.addButton("check-answer",e.params.checkAnswer,(function(){e.answered=!0,e.removeAllElementsFromDragControl(),e.showEvaluation()?(e.hideButton("show-solution"),e.hideButton("try-again"),e.hideButton("check-answer")):(e.params.behaviour.enableRetry&&e.showButton("try-again"),e.params.behaviour.enableSolutionsButton&&e.showButton("show-solution"),e.hideButton("check-answer"),e.disableDraggables()),e.$introduction.parent().focus()}),!e.params.behaviour.instantFeedback,{"aria-label":e.params.a11yCheck},{contentData:e.contentData,textIfSubmitting:e.params.submitAnswer}),e.addButton("show-solution",e.params.showSolution,(function(){e.droppables.forEach((function(e){e.showSolution()})),e.draggables.forEach((function(t){return e.setDraggableAriaLabel(t)})),e.disableDraggables(),e.removeAllDroppablesFromControls(),e.hideButton("show-solution")}),e.initShowShowSolutionButton||!1,{"aria-label":e.params.a11yShowSolution}),e.addButton("try-again",e.params.tryAgain,(function(){e.answered&&e.resetDraggables(),e.answered=!1,e.hideEvaluation(),e.hideExplanation(),e.hideButton("try-again"),e.hideButton("show-solution"),e.params.behaviour.instantFeedback?e.enableAllDropzonesAndDraggables():(e.showButton("check-answer"),e.enableDraggables()),e.hideAllSolutions(),e.stopWatch.reset(),e.read(e.params.taskDescription)}),e.initShowTryAgainButton||!1,{"aria-label":e.params.a11yRetry})},a.prototype.removeAllElementsFromDragControl=function(){var e=this;this.dragControls.elements.forEach((function(t){return e.dragControls.removeElement(t)}))},a.prototype.keyboardDraggableSelected=function(e){var t=this.selectedElement,r=void 0!==this.selectedElement,n=this.selectedElement===e.element;r&&(this.selectedElement=void 0,this.trigger("stop",{element:t})),r&&n||this.isElementDisabled(e.element)||(this.selectedElement=e.element,this.trigger("start",{element:e.element}),this.focusOnFirstEmptyDropZone())},a.prototype.focusOnFirstEmptyDropZone=function(){var e=this.droppables.filter((function(e){return!e.hasDraggable()}))[0].getElement();this.dropControls.setTabbable(e),e.focus()},a.prototype.isElementDisabled=function(e){return"true"===e.getAttribute("aria-disabled")},a.prototype.keyboardDroppableSelected=function(e){var t=this,r=e.element,n=t.getDroppableByElement(r),o=t.getDraggableByElement(this.selectedElement),a=this.params.behaviour.instantFeedback&&n&&n.isCorrect(),i=!this.params.behaviour.instantFeedback&&n.hasFeedback();if(o&&n&&!a){var s=t.selectedElement;t.drop(o,n),t.selectedElement=void 0,this.trigger("stop",{element:s,target:n.getElement()})}else if(n&&n.hasDraggable()&&!i&&!a){var l=r.querySelector("[aria-grabbed]");this.createConfirmResetDialog((function(){t.revert(t.getDraggableByElement(l))})).show()}},a.prototype.toggleDraggablesContainer=function(){var e=0===this.$draggables.children().length;this.$draggables.toggleClass("hide",e)},a.prototype.createConfirmResetDialog=function(e,t){var n=new r({headerText:this.params.resetDropTitle,dialogText:this.params.resetDropDescription});return n.appendTo(document.body),n.on("confirmed",e,t||this),n},a.prototype.showDropzoneFeedback=function(){var e=this;this.droppables.forEach((function(t){t.addFeedback();var r=t.containedDraggable;t&&r&&(e.setDroppableLabel(t.getElement(),r.getElement().textContent,t.getIndex()),e.setDraggableAriaLabel(r))}))},a.prototype.showExplanation=function(){var e=[];this.droppables.forEach((function(t){var r=t.containedDraggable;t&&r&&(t.isCorrect()&&t.correctFeedback&&e.push({correct:r.text,text:t.correctFeedback}),!t.isCorrect()&&t.incorrectFeedback&&e.push({correct:t.text,wrong:r.text,text:t.incorrectFeedback}))})),0!==e.length&&this.setExplanation(e,this.params.feedbackHeader)},a.prototype.showEvaluation=function(e){this.hideEvaluation(),this.showDropzoneFeedback(),this.showExplanation();var t=this.calculateScore(),r=this.droppables.length;if(!e){var n=this.createXAPIEventTemplate("answered");this.addQuestionToXAPI(n),this.addResponseToXAPI(n),this.trigger(n)}var o=H5P.Question.determineOverallFeedback(this.params.overallFeedback,t/r).replace(/@score/g,t.toString()).replace(/@total/g,r.toString());return t===r&&(this.hideButton("check-answer"),this.hideButton("show-solution"),this.hideButton("try-again"),this.disableDraggables()),this.trigger("resize"),this.setFeedback(o,t,r,this.params.scoreBarLabel),t===r},a.prototype.calculateScore=function(){return this.droppables.reduce((function(e,t){return e+(t.isCorrect()?1:0)}),0)},a.prototype.hideEvaluation=function(){this.removeFeedback(),this.trigger("resize")},a.prototype.hideExplanation=function(){this.setExplanation(),this.trigger("resize")},a.prototype.hideAllSolutions=function(){this.droppables.forEach((function(e){e.hideSolution()})),this.trigger("resize")},a.prototype.addTaskTo=function(t){var r=this;r.widest=0,r.widestDraggable=0,r.droppables=[],r.draggables=[],r.$taskContainer=e("<div/>",{class:"h5p-drag-task"}),r.$draggables=e("<div/>",{class:"h5p-drag-draggables-container"}),r.$wordContainer=e("<div/>",{class:"h5p-drag-droppable-words"}),l(r.textFieldHtml).forEach((function(e){if(r.isAnswerPart(e)){var t=h(e);r.createDraggable(t.text),r.createDroppable(t.text,t.tip,t.correctFeedback,t.incorrectFeedback)}else{var n=s.createElementWithTextPart(e);r.$wordContainer.append(n)}})),l(r.distractorsHtml).forEach((function(e){""!==e.trim()&&"*"===e.substring(0,1)&&"*"===e.substring(e.length-1,e.length)&&(e=h(e),r.createDraggable(e.text))})),r.shuffleAndAddDraggables(r.$draggables),r.$draggables.appendTo(r.$taskContainer),r.$wordContainer.appendTo(r.$taskContainer),r.$taskContainer.appendTo(t),r.addDropzoneWidth()},a.prototype.isAnswerPart=function(e){return s.startsWith("*",e)&&s.endsWith("*",e)},a.prototype.addDropzoneWidth=function(){var e=this,t=0,r=0,n=parseInt(this.$inner.css("font-size"),10),o=3*n,a=n;this.draggables.forEach((function(e){var n=e.getDraggableElement(),o=n.clone().css({position:"absolute","white-space":"nowrap",width:"auto",padding:0,margin:0}).html(e.getAnswerText()).appendTo(n.parent()),i=o.outerWidth();r=i>r?i:r,o.text().length>=20&&(o.html(e.getShortFormat()),i=o.width()),i+a>t&&(t=i+a),o.remove()})),t<o&&(t=o),this.widestDraggable=r,this.widest=t,this.droppables.forEach((function(t){t.getDropzone().width(e.widest)}))},a.prototype.createDraggable=function(t){var r=this,n=e("<div/>",{html:"<span>".concat(t,"</span>"),role:"button","aria-grabbed":"false",tabindex:"-1"}).draggable({revert:function(e){return e||r.revert(o),!1},drag:r.propagateDragEvent("drag",r),start:r.propagateDragEvent("start",r),stop:function(e){r.trigger("stop",{element:o.getElement(),target:e.target})},containment:r.$taskContainer}).append(e("<span>",{class:"h5p-hidden-read"})),o=new g(t,n,r.draggables.length);return o.on("addedToZone",(function(){r.triggerXAPI("interacted")})),r.draggables.push(o),o},a.prototype.createDroppable=function(t,r,n,o){var a=this,i=this.draggables.length,s=e("<div/>",{class:"h5p-drag-dropzone-container"}),l=e("<div/>",{"aria-dropeffect":"none","aria-label":this.params.dropZoneIndex.replace("@index",i.toString())+" "+this.params.empty.replace("@index",i.toString()),tabindex:"-1"}).appendTo(s).droppable({tolerance:"pointer",drop:function(e,t){var r=a.getDraggableByElement(t.draggable[0]),n=a.getDroppableByElement(e.target);r&&n&&a.drop(r,n)}}),h=new u(t,r,n,o,l,s,i,a.params);return h.appendDroppableTo(a.$wordContainer),a.droppables.push(h),h},a.prototype.propagateDragEvent=s.curry((function(e,t,r){t.trigger(e,{element:r.target})})),a.prototype.revert=function(e){var t=e.removeFromZone(),r=t?t.getElement():void 0;e.revertDraggableTo(this.$draggables),this.setDraggableAriaLabel(e),this.trigger("revert",{element:e.getElement(),target:r}),this.trigger("resize")},a.prototype.drop=function(e,t){var r=this;r.answered=!0,e.removeFromZone();var n=t.appendInsideDroppableTo(this.$draggables);n&&r.trigger("revert",{element:n.getElement(),target:t.getElement()}),t.setDraggable(e),e.appendDraggableTo(t.getDropzone()),r.params.behaviour.instantFeedback&&(t.addFeedback(),r.instantFeedbackEvaluation(),r.params.behaviour.enableRetry&&!t.isCorrect()||t.disableDropzoneAndContainedDraggable()),this.trigger("drop",{element:e.getElement(),target:t.getElement()}),this.trigger("resize")},a.prototype.shuffleAndAddDraggables=function(e){var t=this;return s.shuffle(this.draggables).map((function(e,t){return e.setIndex(t)})).map((function(r){return t.addDraggableToContainer(e,r)})).map((function(e){return t.setDraggableAriaLabel(e)})).map((function(e){return t.addDraggableToControls(t.dragControls,e)}))},a.prototype.setDraggableAriaLabel=function(e){return e.updateAriaLabel(this.params.ariaDraggableIndex.replace("@index",(e.getIndex()+1).toString()).replace("@count",this.draggables.length.toString())),e},a.prototype.isGrabbed=function(e){return"true"===e.getAttribute("aria-grabbed")},a.prototype.addDraggableToContainer=function(e,t){return t.appendDraggableTo(e),t},a.prototype.addDraggableToControls=function(e,t){return e.addElement(t.getElement()),t},a.prototype.instantFeedbackEvaluation=function(){var e=this;e.isAllAnswersFilled()?(e.params.behaviour.enableSolutionsButton&&e.showButton("show-solution"),e.params.behaviour.enableRetry&&e.showButton("try-again"),e.showEvaluation()):(e.hideButton("try-again"),e.hideButton("show-solution"),e.hideEvaluation())},a.prototype.isAllAnswersFilled=function(){return this.droppables.every((function(e){return e.hasDraggable()}))},a.prototype.enableAllDropzonesAndDraggables=function(){this.enableDraggables(),this.droppables.forEach((function(e){e.enableDropzone()}))},a.prototype.disableDraggables=function(){this.draggables.forEach((function(e){e.disableDraggable()}))},a.prototype.enableDraggables=function(){this.draggables.forEach((function(e){e.enableDraggable()}))},a.prototype.getAnswerGiven=function(){return this.answered},a.prototype.getScore=function(){return this.calculateScore()},a.prototype.getMaxScore=function(){return this.droppables.length},a.prototype.getTitle=function(){return H5P.createTitle(this.contentData&&this.contentData.metadata&&this.contentData.metadata.title?this.contentData.metadata.title:"Drag the Words")},a.prototype.toggleDropEffect=function(){var e=void 0!==this.selectedElement;this.ariaDropControls[e?"setAllToMove":"setAllToNone"]()},a.prototype.getDraggableByElement=function(e){return this.draggables.filter((function(t){return t.$draggable.get(0)===e}),this)[0]},a.prototype.getDroppableByElement=function(e){return this.droppables.filter((function(t){return t.$dropzone.get(0)===e}),this)[0]},a.prototype.showSolutions=function(){this.showEvaluation(!0),this.droppables.forEach((function(e){e.addFeedback(),e.showSolution()})),this.removeAllDroppablesFromControls(),this.disableDraggables(),this.hideButton("try-again"),this.hideButton("show-solution"),this.hideButton("check-answer"),this.trigger("resize")},a.prototype.resetTask=function(){var e=this;e.answered=!1,e.resetDraggables(),e.hideEvaluation(),e.hideExplanation(),e.enableAllDropzonesAndDraggables(),e.hideButton("try-again"),e.hideButton("show-solution"),e.params.behaviour.instantFeedback||e.showButton("check-answer"),e.hideAllSolutions(),this.trigger("resize")},a.prototype.resetDraggables=function(){s.shuffle(this.draggables).forEach(this.revert,this)},a.prototype.getCurrentState=function(){var e=this;if(void 0!==this.draggables)return this.draggables.filter((function(e){return null!==e.getInsideDropzone()})).map((function(t){return{draggable:t.getInitialIndex(),droppable:e.droppables.indexOf(t.getInsideDropzone())}}))},a.prototype.setH5PUserState=function(){var e=this,t=this;void 0!==this.previousState&&(this.previousState.forEach((function(r){if(!t.isValidIndex(r.draggable)||!t.isValidIndex(r.droppable))throw new Error("Stored user state is invalid");var n=e.getDraggableByInitialIndex(r.draggable),o=t.droppables[r.droppable];t.drop(n,o),t.params.behaviour.instantFeedback&&(null!==o&&o.addFeedback(),o.isCorrect()&&o.disableDropzoneAndContainedDraggable())})),t.params.behaviour.instantFeedback&&t.isAllAnswersFilled()&&!t.showEvaluation()&&(t.params.behaviour.enableSolutionsButton&&(t.initShowShowSolutionButton=!0),t.params.behaviour.enableRetry&&(t.initShowTryAgainButton=!0)))},a.prototype.isValidIndex=function(e){return!isNaN(e)&&e<this.draggables.length&&e>=0},a.prototype.getDraggableByInitialIndex=function(e){return this.draggables.filter((function(t){return t.hasInitialIndex(e)}))[0]},a.prototype.getXAPIData=function(){var e=this.createXAPIEventTemplate("answered");return this.addQuestionToXAPI(e),this.addResponseToXAPI(e),{statement:e.data.statement}},a.prototype.addQuestionToXAPI=function(t){var r=t.getVerifiedStatementValue(["object","definition"]);e.extend(r,this.getxAPIDefinition())},a.prototype.getxAPIDefinition=function(){var e={interactionType:"fill-in",type:"http://adlnet.gov/expapi/activities/cmi.interaction"},t=this.textFieldHtml.replaceAll(/_{10,}/gi,"_________"),r=this.params.taskDescription.replaceAll(/_{10,}/gi,"_________")+"<br/>";return e.description={"en-US":r+this.replaceSolutionsWithBlanks(t)},e.correctResponsesPattern=[this.getSolutionsFromQuestion(t)],e},a.prototype.addResponseToXAPI=function(e){var t,r=this,n=r.getScore(),o=r.droppables.length;e.setScoredResult(n,o,r);var a={min:0,raw:n,max:o,scaled:Math.round(n/o*1e4)/1e4};r.stopWatch&&(t="PT"+r.stopWatch.stop()+"S"),e.data.statement.result={response:r.getXAPIResponse(),score:a,duration:t,completion:!0}},a.prototype.getXAPIResponse=function(){return this.droppables.map((function(e){return e.hasDraggable()?e.containedDraggable.text:""})).join("[,]")},a.prototype.replaceSolutionsWithBlanks=function(e){var t=this;return l(e).map((function(e){return t.isAnswerPart(e)?"__________":e})).join("")},a.prototype.getSolutionsFromQuestion=function(e){return l(e).filter(this.isAnswerPart).map((function(e){return h(e)})).map((function(e){return e.text})).join("[,]")},a.prototype.parseText=function(e){return l(e)},a}(H5P.jQuery,H5P.Question,H5P.ConfirmationDialog),H5P.DragText.parseText=function(e){return l(e).map((function(e){return function(e){return s.startsWith("*",e)&&s.endsWith("*",e)}(e)?{type:"answer",correct:h(e).text}:{type:"text",content:e}}))};const Y=H5P.DragText},477:(e,t,r)=>{"use strict";r.r(t)}},t={};function r(n){var o=t[n];if(void 0!==o)return o.exports;var a=t[n]={exports:{}};return e[n](a,a.exports,r),a.exports}r.d=(e,t)=>{for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r(477),H5P=H5P||{},H5P.DragText=r(97).A})();;
H5P.Column = (function (EventDispatcher) {

  /**
   * Column Constructor
   *
   * @class
   * @param {Object} params Describes task behavior
   * @param {number} id Content identifier
   * @param {Object} data User specific data to adapt behavior
   */
  function Column(params, id, data) {
    /** @alias H5P.Column# */
    var self = this;

    // We support events by extending this class
    EventDispatcher.call(self);

    // Add defaults
    params = params || {};
    if (params.useSeparators === undefined) {
      params.useSeparators = true;
    }

    this.contentData = data;

    // Column wrapper element
    var wrapper;

    // H5P content in the column
    var instances = [];
    var instanceContainers = [];

    // Number of tasks among instances
    var numTasks = 0;

    // Number of tasks that has been completed
    var numTasksCompleted = 0;

    // Keep track of result for each task
    var tasksResultEvent = [];

    // Keep track of last content's margin state
    var previousHasMargin;

    /**
     * Calculate score and trigger completed event.
     *
     * @private
     */
    var completed = function () {
      // Sum all scores
      var raw = 0;
      var max = 0;

      for (var i = 0; i < tasksResultEvent.length; i++) {
        var event = tasksResultEvent[i];
        raw += event.getScore();
        max += event.getMaxScore();
      }

      self.triggerXAPIScored(raw, max, 'completed');
    };

    /**
     * Generates an event handler for the given task index.
     *
     * @private
     * @param {number} taskIndex
     * @return {function} xAPI event handler
     */
    var trackScoring = function (taskIndex) {
      return function (event) {
        if (event.getScore() === null) {
          return; // Skip, not relevant
        }

        if (tasksResultEvent[taskIndex] === undefined) {
          // Update number of completed tasks
          numTasksCompleted++;
        }

        // Keep track of latest event with result
        tasksResultEvent[taskIndex] = event;

        // Track progress
        var progressed = self.createXAPIEventTemplate('progressed');
        progressed.data.statement.object.definition.extensions['http://id.tincanapi.com/extension/ending-point'] = taskIndex + 1;
        self.trigger(progressed);

        // Check to see if we're done
        if (numTasksCompleted === numTasks) {
          // Run this after the current event is sent
          setTimeout(function () {
            completed(); // Done
          }, 0);
        }
      };
    };

    /**
     * Creates a new ontent instance from the given content parameters and
     * then attaches it the wrapper. Sets up event listeners.
     *
     * @private
     * @param {Object} content Parameters
     * @param {Object} [contentData] Content Data
     */
    var addRunnable = function (content, contentData) {
      // Create container for content
      var container = document.createElement('div');
      container.classList.add('h5p-column-content');

      // Content overrides
      var library = content.library.split(' ')[0];
      if (library === 'H5P.Video') {
        // Prevent video from growing endlessly since height is unlimited.
        content.params.visuals.fit = false;
      }

      // Create content instance
      var instance = H5P.newRunnable(content, id, undefined, true, contentData);

      // Bubble resize events
      bubbleUp(instance, 'resize', self);

      // Check if instance is a task
      if (Column.isTask(instance)) {
        // Tasks requires completion

        instance.on('xAPI', trackScoring(numTasks));
        numTasks++;
      }

      if (library === 'H5P.Image') {
        // Resize when images are loaded

        instance.on('loaded', function () {
          self.trigger('resize');
        });
      }

      // Keep track of all instances
      instances.push(instance);
      instanceContainers.push({
        hasAttached: false,
        container: container,
        instanceIndex: instances.length - 1,
      });

      // Add to DOM wrapper
      wrapper.appendChild(container);
    };

    /**
     * Help get data for content at given index
     *
     * @private
     * @param {number} index
     * @returns {Object} Data object with previous state
     */
    var grabContentData = function (index) {
      var contentData = {
        parent: self
      };

      if (data.previousState && data.previousState.instances && data.previousState.instances[index]) {
        contentData.previousState = data.previousState.instances[index];
      }

      return contentData;
    };

    /**
     * Adds separator before the next content.
     *
     * @private
     * @param {string} libraryName Name of the next content type
     * @param {string} useSeparator
     */
    var addSeparator = function (libraryName, useSeparator) {
      // Determine separator spacing
      var thisHasMargin = (hasMargins.indexOf(libraryName) !== -1);

      // Only add if previous content exists
      if (previousHasMargin !== undefined) {

        // Create separator element
        var separator = document.createElement('div');
        //separator.classList.add('h5p-column-ruler');

        // If no margins, check for top margin only
        if (!thisHasMargin && (hasTopMargins.indexOf(libraryName) === -1)) {
          if (!previousHasMargin) {
            // None of them have margin

            // Only add separator if forced
            if (useSeparator === 'enabled') {
              // Add ruler
              separator.classList.add('h5p-column-ruler');

              // Add space both before and after the ruler
              separator.classList.add('h5p-column-space-before-n-after');
            }
            else {
              // Default is to separte using a single space, no ruler
              separator.classList.add('h5p-column-space-before');
            }
          }
          else {
            // We don't have any margin but the previous content does

            // Only add separator if forced
            if (useSeparator === 'enabled') {
              // Add ruler
              separator.classList.add('h5p-column-ruler');

              // Add space after the ruler
              separator.classList.add('h5p-column-space-after');
            }
          }
        }
        else if (!previousHasMargin) {
          // We have margin but not the previous content doesn't

          // Only add separator if forced
          if (useSeparator === 'enabled') {
            // Add ruler
            separator.classList.add('h5p-column-ruler');

            // Add space after the ruler
            separator.classList.add('h5p-column-space-before');
          }
        }
        else {
          // Both already have margin

          if (useSeparator !== 'disabled') {
            // Default is to add ruler unless its disabled
            separator.classList.add('h5p-column-ruler');
          }
        }

        // Insert into DOM
        wrapper.appendChild(separator);
      }

      // Keep track of spacing for next separator
      previousHasMargin = thisHasMargin || (hasBottomMargins.indexOf(libraryName) !== -1);
    };

    /**
     * Creates a wrapper and the column content the first time the column
     * is attached to the DOM.
     *
     * @private
     */
    var createHTML = function () {
      // Create wrapper
      wrapper = document.createElement('div');

      // Go though all contents
      for (var i = 0; i < params.content.length; i++) {
        var content = params.content[i];

        // In case the author has created an element without selecting any
        // library
        if (content.content === undefined) {
          continue;
        }

        if (params.useSeparators) { // (check for global override)

          // Add separator between contents
          addSeparator(content.content.library.split(' ')[0], content.useSeparator);
        }

        // Add content
        addRunnable(content.content, grabContentData(i));
      }
    };

    /**
     * Attach the column to the given container
     *
     * @param {H5P.jQuery} $container
     */
    self.attach = function ($container) {
      if (wrapper === undefined) {
        // Create wrapper and content
        createHTML();
      }

      // Attach instances that have not been attached
      instanceContainers.filter(function (container) { return !container.hasAttached })
        .forEach(function (container) {
          instances[container.instanceIndex]
            .attach(H5P.jQuery(container.container));

          // Remove any fullscreen buttons
          disableFullscreen(instances[container.instanceIndex]);
        });


      // Add to DOM
      $container.addClass('h5p-column').html('').append(wrapper);
    };

    /**
     * Create object containing information about the current state
     * of this content.
     *
     * @return {Object}
     */
    self.getCurrentState = function () {
      // Get previous state object or create new state object
      var state = (data.previousState ? data.previousState : {});
      if (!state.instances) {
        state.instances = [];
      }

      // Grab the current state for each instance
      for (var i = 0; i < instances.length; i++) {
        var instance = instances[i];

        if (instance.getCurrentState instanceof Function ||
            typeof instance.getCurrentState === 'function') {

          state.instances[i] = instance.getCurrentState();
        }
      }

      // Done
      return state;
    };

    /**
     * Get xAPI data.
     * Contract used by report rendering engine.
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
     */
    self.getXAPIData = function () {
      var xAPIEvent = self.createXAPIEventTemplate('answered');
      addQuestionToXAPI(xAPIEvent);
      xAPIEvent.setScoredResult(self.getScore(),
        self.getMaxScore(),
        self,
        true,
        self.getScore() === self.getMaxScore()
      );
      return {
        statement: xAPIEvent.data.statement,
        children: getXAPIDataFromChildren(instances)
      };
    };

    /**
     * Get score for all children
     * Contract used for getting the complete score of task.
     *
     * @return {number} Score for questions
     */
    self.getScore = function () {
      return instances.reduce(function (prev, instance) {
        return prev + (instance.getScore ? instance.getScore() : 0);
      }, 0);
    };

    /**
     * Get maximum score possible for all children instances
     * Contract.
     *
     * @return {number} Maximum score for questions
     */
    self.getMaxScore = function () {
      return instances.reduce(function (prev, instance) {
        return prev + (instance.getMaxScore ? instance.getMaxScore() : 0);
      }, 0);
    };

    /**
     * Get answer given
     * Contract.
     *
     * @return {boolean} True, if all answers have been given.
     */
    self.getAnswerGiven = function () {
      return instances.reduce(function (prev, instance) {
        return prev && (instance.getAnswerGiven ? instance.getAnswerGiven() : prev);
      }, true);
    };

    /**
     * Show solutions.
     * Contract.
     */
    self.showSolutions = function () {
      instances.forEach(function (instance) {
        if (instance.toggleReadSpeaker) {
          instance.toggleReadSpeaker(true);
        }
        if (instance.showSolutions) {
          instance.showSolutions();
        }
        if (instance.toggleReadSpeaker) {
          instance.toggleReadSpeaker(false);
        }
      });
    };

    /**
     * Reset task.
     * Contract.
     */
    self.resetTask = function () {
      instances.forEach(function (instance) {
        if (instance.resetTask) {
          instance.resetTask();
        }
      });
    };

    /**
     * Get instances for all children
     * TODO: This is not a good interface, we should provide handling needed
     * handling of the tasks instead of repeating them for each parent...
     *
     * @return {Object[]} array of instances
     */
    self.getInstances = function () {
      return instances;
    };

    /**
     * Get title, e.g. for xAPI when Column is subcontent.
     *
     * @return {string} Title.
     */
    self.getTitle = function () {
      return H5P.createTitle((self.contentData && self.contentData.metadata && self.contentData.metadata.title) ? self.contentData.metadata.title : 'Column');
    };

    /**
     * Add the question itself to the definition part of an xAPIEvent
     */
    var addQuestionToXAPI = function (xAPIEvent) {
      var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
      H5P.jQuery.extend(definition, getxAPIDefinition());
    };

    /**
     * Generate xAPI object definition used in xAPI statements.
     * @return {Object}
     */
    var getxAPIDefinition = function () {
      var definition = {};

      definition.interactionType = 'compound';
      definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
      definition.description = {
        'en-US': ''
      };

      return definition;
    };

    /**
     * Get xAPI data from sub content types
     *
     * @param {Array} of H5P instances
     * @returns {Array} of xAPI data objects used to build a report
     */
    var getXAPIDataFromChildren = function (children) {
      return children.map(function (child) {
        if (typeof child.getXAPIData == 'function') {
          return child.getXAPIData();
        }
      }).filter(function (data) {
        return !!data;
      });
    };

    // Resize children to fit inside parent
    bubbleDown(self, 'resize', instances);

    if (wrapper === undefined) {
      // Create wrapper and content
      createHTML();
    }

    self.setActivityStarted();
  }

  Column.prototype = Object.create(EventDispatcher.prototype);
  Column.prototype.constructor = Column;

  /**
   * Makes it easy to bubble events from parent to children
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Array} targets Targets to trigger event on
   */
  function bubbleDown(origin, eventName, targets) {
    origin.on(eventName, function (event) {
      if (origin.bubblingUpwards) {
        return; // Prevent send event back down.
      }

      for (var i = 0; i < targets.length; i++) {
        targets[i].trigger(eventName, event);
      }
    });
  }

  /**
   * Makes it easy to bubble events from child to parent
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Object} target Target to trigger event on
   */
  function bubbleUp(origin, eventName, target) {
    origin.on(eventName, function (event) {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;

      // Trigger event
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  }

  /**
   * Definition of which content types are tasks
   */
  var isTasks = [
    'H5P.ImageHotspotQuestion',
    'H5P.Blanks',
    'H5P.Essay',
    'H5P.SingleChoiceSet',
    'H5P.MultiChoice',
    'H5P.TrueFalse',
    'H5P.DragQuestion',
    'H5P.Summary',
    'H5P.DragText',
    'H5P.MarkTheWords',
    'H5P.MemoryGame',
    'H5P.QuestionSet',
    'H5P.InteractiveVideo',
    'H5P.CoursePresentation',
    'H5P.DocumentationTool',
    'H5P.MultiMediaChoice'
  ];

  /**
   * Check if the given content instance is a task (will give a score)
   *
   * @param {Object} instance
   * @return {boolean}
   */
  Column.isTask = function (instance) {
    if (instance.isTask !== undefined) {
      return instance.isTask; // Content will determine self if it's a task
    }

    // Go through the valid task names
    for (var i = 0; i < isTasks.length; i++) {
      // Check against library info. (instanceof is broken in H5P.newRunnable)
      if (instance.libraryInfo.machineName === isTasks[i]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Definition of which content type have margins
   */
  var hasMargins = [
    'H5P.AdvancedText',
    'H5P.AudioRecorder',
    'H5P.Essay',
    'H5P.Link',
    'H5P.Accordion',
    'H5P.Table',
    'H5P.GuessTheAnswer',
    'H5P.Blanks',
    'H5P.MultiChoice',
    'H5P.TrueFalse',
    'H5P.DragQuestion',
    'H5P.Summary',
    'H5P.DragText',
    'H5P.MarkTheWords',
    'H5P.ImageHotspotQuestion',
    'H5P.MemoryGame',
    'H5P.Dialogcards',
    'H5P.QuestionSet',
    'H5P.DocumentationTool'
  ];

  /**
   * Definition of which content type have top margins
   */
  var hasTopMargins = [
    'H5P.SingleChoiceSet'
  ];

  /**
   * Definition of which content type have bottom margins
   */
  var hasBottomMargins = [
    'H5P.CoursePresentation',
    'H5P.Dialogcards',
    'H5P.GuessTheAnswer',
    'H5P.ImageSlider'
  ];

  /**
   * Remove custom fullscreen buttons from sub content.
   * (A bit of a hack, there should have been some sort of override…)
   *
   * @param {Object} instance
   */
  function disableFullscreen(instance) {
    switch (instance.libraryInfo.machineName) {
      case 'H5P.CoursePresentation':
        if (instance.$fullScreenButton) {
          instance.$fullScreenButton.remove();
        }
        break;

      case 'H5P.InteractiveVideo':
        instance.on('controls', function () {
          if (instance.controls.$fullscreen) {
            instance.controls.$fullscreen.remove();
          }
        });
        break;
    }
  }

  return Column;
})(H5P.EventDispatcher);
;
var H5P = H5P || {};

/**
 * H5P-Text Utilities
 *
 * Some functions that can be useful when dealing with texts in H5P.
 *
 * @param {H5P.jQuery} $
 */
H5P.TextUtilities = function () {
  'use strict';
  /**
   * Create Text Utilities.
   *
   * Might be needed later.
   *
   * @constructor
   */
  function TextUtilities () {
  }

  // Inheritance
  TextUtilities.prototype = Object.create(H5P.EventDispatcher.prototype);
  TextUtilities.prototype.constructor = TextUtilities;

  /** @constant {object} */
  TextUtilities.WORD_DELIMITER = /[\s.?!,\';\"]/g;

  /**
   * Check if a candidate string is considered isolated (in a larger string) by
   * checking the symbol before and after the candidate.
   *
   * @param {string} candidate - String to be looked for.
   * @param {string} text - (Larger) string that should contain candidate.
   * @param {object} params - Parameters.
   * @param {object} params.delimiter - Regular expression containing symbols used to isolate the candidate.
   * @return {boolean} True if string is isolated.
   */
  TextUtilities.isIsolated = function (candidate, text, params) {
    // Sanitization
    if (!candidate || !text) {
      return;
    }
    var delimiter = (!!params && !!params.delimiter) ? params.delimiter : TextUtilities.WORD_DELIMITER;

    var pos = (!!params && !!params.index && typeof params.index === 'number') ? params.index : text.indexOf(candidate);
    if (pos < 0 || pos > text.length-1) {
      return false;
    }

    var pred = (pos === 0 ? '' : text[pos - 1].replace(delimiter, ''));
    var succ = (pos + candidate.length === text.length ? '' : text[pos + candidate.length].replace(delimiter, ''));

    if (pred !== '' || succ !== '') {
      return false;
    }
    return true;
  };

  /**
   * Check whether two strings are considered to be similar.
   * The similarity is temporarily computed by word length and number of number of operations
   * required to change one word into the other (Damerau-Levenshtein). It's subject to
   * change, cmp. https://github.com/otacke/udacity-machine-learning-engineer/blob/master/submissions/capstone_proposals/h5p_fuzzy_blanks.md
   *
   * @param {String} string1 - String #1.
   * @param {String} string2 - String #2.
   * @param {object} params - Parameters.
   * @return {boolean} True, if strings are considered to be similar.
   */
  TextUtilities.areSimilar = function (string1, string2) {
    // Sanitization
    if (!string1 || typeof string1 !== 'string') {
      return;
    }
    if (!string2 || typeof string2 !== 'string') {
      return;
    }

    // Just temporariliy this unflexible. Will be configurable via params.
    var length = Math.min(string1.length, string2.length);
    var levenshtein = H5P.TextUtilities.computeLevenshteinDistance(string1, string2, true);
    if (levenshtein === 0) {
      return true;
    }
    if ((length > 9) && (levenshtein <= 2)) {
      return true;
    }
    if ((length > 3) && (levenshtein <= 1)) {
      return true;
    }
    return false;
  };

  /**
   * Compute the (Damerau-)Levenshtein distance for two strings.
   *
   * The (Damerau-)Levenshtein distance that is returned is equivalent to the
   * number of operations that are necessary to transform one string into the
   * other. Consequently, lower numbers indicate higher similarity between the
   * two strings.
   *
   * While the Levenshtein distance counts deletions, insertions and mismatches,
   * the Damerau-Levenshtein distance also counts swapping two characters as
   * only one operation (instead of two mismatches), because this seems to
   * happen quite often.
   *
   * See http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance for details
   *
   * @public
   * @param {string} str1 - String no. 1.
   * @param {string} str2 - String no. 2.
   * @param {boolean} [countSwapping=false] - If true, swapping chars will count as operation.
   * @returns {number} Distance.
   */
  TextUtilities.computeLevenshteinDistance = function(str1, str2, countSwapping) {
    // sanity checks
    if (typeof str1 !== 'string' || typeof str2 !== 'string') {
      return undefined;
    }
    if (countSwapping && typeof countSwapping !== 'boolean') {
      countSwapping = false;
    }

    // degenerate cases
    if (str1 === str2) {
      return 0;
    }
    if (str1.length === 0) {
      return str2.length;
    }
    if (str2.length === 0) {
      return str1.length;
    }

    // counter variables
    var i, j;

    // indicates characters that don't match
    var cost;

    // matrix for storing distances
    var distance = [];

    // initialization
    for (i = 0; i <= str1.length; i++) {
      distance[i] = [i];
    }
    for (j = 0; j <= str2.length; j++) {
      distance[0][j] = j;
    }

    // computation
    for (i = 1; i <= str1.length; i++) {
      for (j = 1; j <= str2.length; j++) {
        cost = (str1[i-1] === str2[j-1]) ? 0 : 1;
        distance[i][j] = Math.min(
          distance[i-1][j] + 1,     // deletion
          distance[i][j-1] + 1,     // insertion
          distance[i-1][j-1] + cost // mismatch
        );
        // in Damerau-Levenshtein distance, transpositions are operations
        if (countSwapping) {
          if (i > 1 && j > 1 && str1[i-1] === str2[j-2] && str1[i-2] === str2[j-1]) {
            distance[i][j] = Math.min(distance[i][j], distance[i-2][j-2] + cost);
          }
        }
      }
    }
    return distance[str1.length][str2.length];
  };

  /**
   * Compute the Jaro(-Winkler) distance for two strings.
   *
   * The Jaro(-Winkler) distance will return a value between 0 and 1 indicating
   * the similarity of two strings. The higher the value, the more similar the
   * strings are.
   *
   * See https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance for details
   *
   * It seems that a more generalized implementation of Winkler's modification
   * can improve the results. This might be implemented later.
   * http://disi.unitn.it/~p2p/RelatedWork/Matching/Hermans_bnaic-2012.pdf
   *
   * @public
   * @param {string} str1 - String no. 1.
   * @param {string} str2 - String no. 2.
   * @param {boolean} [favorSameStart=false] - If true, strings with same start get higher distance value.
   * @param {boolean} [longTolerance=false] - If true, Winkler's tolerance for long words will be used.
   * @returns {number} Distance.
   */
  TextUtilities.computeJaroDistance = function(str1, str2, favorSameStart, longTolerance) {
    // sanity checks
    if (typeof str1 !== 'string' || typeof str2 !== 'string') {
      return undefined;
    }
    if (favorSameStart && typeof favorSameStart !== 'boolean') {
      favorSameStart = false;
    }
    if (longTolerance && typeof longTolerance !== 'boolean') {
      longTolerance = false;
    }

    // degenerate cases
    if (str1.length === 0 || str2.length === 0) {
      return 0;
    }
    if (str1 === str2) {
      return 1;
    }

    // counter variables
    var i, j, k;

    // number of matches between both strings
    var matches = 0;

    // number of transpositions between both strings
    var transpositions = 0;

    // The Jaro-Winkler distance
    var distance = 0;

    // length of common prefix up to 4 chars
    var l = 0;

    // scaling factor, should not exceed 0.25 (Winkler default = 0.1)
    var p = 0.1;

    // will be used often
    var str1Len = str1.length;
    var str2Len = str2.length;

    // determines the distance that still counts as a match
    var matchWindow = Math.floor(Math.max(str1Len, str2Len) / 2)- 1;

    // will store matches
    var str1Flags = new Array(str1Len);
    var str2Flags = new Array(str2Len);

    // count matches
    for (i = 0; i < str1Len; i++) {
      var start  = (i >= matchWindow) ? i - matchWindow : 0;
      var end = (i + matchWindow <= (str2Len - 1)) ? (i + matchWindow) : (str2Len - 1);

      for (j = start; j <= end; j++) {
        if (str1Flags[i] !== true && str2Flags[j] !== true && str1[i] === str2[j]) {
          str1Flags[i] = str2Flags[j] = true;
          matches += 1;
          break;
        }
      }
    }
    if (matches === 0) {
      return 0;
    }

    // count transpositions
    k = 0;
    for (i = 0; i < str1Len; i++) {
      if (!str1Flags[i]) {
        continue;
      }
      while (!str2Flags[k]) {
        k += 1;
      }
      if (str1[i] !== str2[k]) {
        transpositions += 1;
      }
      k += 1;
    }
    transpositions = transpositions / 2;

    // compute Jaro distance
    distance = (matches/str1Len + matches/str2Len + (matches - transpositions) / matches) / 3;

    // modification used by Winkler
    if (favorSameStart) {
      if (distance > 0.7 && str1Len > 3 && str2Len > 3) {
        while (str1[l] === str2[l] && l < 4) {
          l += 1;
        }
        distance = distance + l * p * (1 - distance);

        // modification for long words
        if (longTolerance) {
          if (Math.max(str1Len, str2Len) > 4 && matches > l + 1 && 2 * matches >= Math.max(str1Len, str2Len) + l) {
            distance += ((1.0 - distance) * ((matches - l - 1) / (str1Len + str2Len - 2 * l + 2)));
          }
        }
      }
    }

    return distance;
  };


  /**
   * Check whether a text contains a string, but fuzzy.
   *
   * This function is naive. It moves a window of needle's length (+2)
   * over the haystack's text and each move compares for similarity using
   * a given string metric. This will be slow for long texts!!!
   *
   * TODO: You might want to look into the bitap algorithm or experiment
   *       with regexps
   *
   * @param {String} needle - String to look for.
   * @param {String} haystack - Text to look in.
   */
  TextUtilities.fuzzyContains = function (needle, haystack) {
    return this.fuzzyFind(needle, haystack).contains;
  };

  /**
   * Find the first position of a fuzzy string within a text
   * @param {String} needle - String to look for.
   * @param {String} haystack - Text to look in.
   */
  TextUtilities.fuzzyIndexOf = function (needle, haystack) {
    return this.fuzzyFind(needle, haystack).indexOf;
  };

  /**
   * Find the first fuzzy match of a string within a text
   * @param {String} needle - String to look for.
   * @param {String} haystack - Text to look in.
   */
  TextUtilities.fuzzyMatch = function (needle, haystack) {
    return this.fuzzyFind(needle, haystack).match;
  };

  /**
   * Find a fuzzy string with in a text.
   * TODO: This could be cleaned ...
   * @param {String} needle - String to look for.
   * @param {String} haystack - Text to look in.
   * @param {object} params - Parameters.
   */
  TextUtilities.fuzzyFind = function (needle, haystack, params) {
    // Sanitization
    if (!needle || typeof needle !== 'string') {
      return false;
    }
    if (!haystack || typeof haystack !== 'string') {
      return false;
    }
    if (params === undefined || params.windowSize === undefined || typeof params.windowSize !== 'number') {
      params = {'windowSize': 3};
    }

    var match;

    var found = haystack.split(' ').some(function(hay) {
      match = hay;
      return H5P.TextUtilities.areSimilar(needle, hay);
    });
    if (found) {
      return {'contains' : found, 'match': match, 'index': haystack.indexOf(match)};
    }

    // This is not used for single words but for phrases
    for (var i = 0; i < haystack.length - needle.length + 1; i++) {
      var hay = [];
      for (var j = 0; j < params.windowSize; j++) {
        hay[j] = haystack.substr(i, needle.length + j);
      }

      // Checking isIsolated will e.g. prevent finding beginnings of words
      for (var j = 0; j < hay.length; j++) {
        if (TextUtilities.isIsolated(hay[j], haystack) && TextUtilities.areSimilar(hay[j], needle)) {
          match = hay[j];
          found = true;
          break;
        }
      }
      if (found) {
        break;
      }
    }
    if (!found) {
      match = undefined;
    }
    return {'contains' : found, 'match': match, 'index': haystack.indexOf(match)};
  };

  return TextUtilities;
}();
;
/*global H5P*/
H5P.Blanks = (function ($, Question) {
  /**
   * @constant
   * @default
   */
  var STATE_ONGOING = 'ongoing';
  var STATE_CHECKING = 'checking';
  var STATE_SHOWING_SOLUTION = 'showing-solution';
  var STATE_FINISHED = 'finished';

  const XAPI_ALTERNATIVE_EXTENSION = 'https://h5p.org/x-api/alternatives';
  const XAPI_CASE_SENSITIVITY = 'https://h5p.org/x-api/case-sensitivity';
  const XAPI_REPORTING_VERSION_EXTENSION = 'https://h5p.org/x-api/h5p-reporting-version';

  /**
   * @typedef {Object} Params
   *  Parameters/configuration object for Blanks
   *
   * @property {Object} Params.behaviour
   * @property {string} Params.behaviour.confirmRetryDialog
   * @property {string} Params.behaviour.confirmCheckDialog
   *
   * @property {Object} Params.confirmRetry
   * @property {string} Params.confirmRetry.header
   * @property {string} Params.confirmRetry.body
   * @property {string} Params.confirmRetry.cancelLabel
   * @property {string} Params.confirmRetry.confirmLabel
   *
   * @property {Object} Params.confirmCheck
   * @property {string} Params.confirmCheck.header
   * @property {string} Params.confirmCheck.body
   * @property {string} Params.confirmCheck.cancelLabel
   * @property {string} Params.confirmCheck.confirmLabel
   */

  /**
   * Initialize module.
   *
   * @class H5P.Blanks
   * @extends H5P.Question
   * @param {Params} params
   * @param {number} id Content identification
   * @param {Object} contentData Task specific content data
   */
  function Blanks(params, id, contentData) {
    var self = this;

    // Inheritance
    Question.call(self, 'blanks');

    // IDs
    this.contentId = id;
    this.contentData = contentData;

    this.params = $.extend(true, {}, {
      text: "Fill in",
      questions: [
        "<p>Oslo is the capital of *Norway*.</p>"
      ],
      overallFeedback: [],
      userAnswers: [], // TODO This isn't in semantics?
      showSolutions: "Show solution",
      tryAgain: "Try again",
      checkAnswer: "Check",
      changeAnswer: "Change answer",
      notFilledOut: "Please fill in all blanks to view solution",
      answerIsCorrect: "':ans' is correct",
      answerIsWrong: "':ans' is wrong",
      answeredCorrectly: "Answered correctly",
      answeredIncorrectly: "Answered incorrectly",
      solutionLabel: "Correct answer:",
      inputLabel: "Blank input @num of @total",
      inputHasTipLabel: "Tip available",
      tipLabel: "Tip",
      scoreBarLabel: 'You got :num out of :total points',
      behaviour: {
        enableRetry: true,
        enableSolutionsButton: true,
        enableCheckButton: true,
        caseSensitive: true,
        showSolutionsRequiresInput: true,
        autoCheck: false,
        separateLines: false
      },
      a11yCheck: 'Check the answers. The responses will be marked as correct, incorrect, or unanswered.',
      a11yShowSolution: 'Show the solution. The task will be marked with its correct solution.',
      a11yRetry: 'Retry the task. Reset all responses and start the task over again.',
      a11yHeader: 'Checking mode',
      submitAnswer: 'Submit',
    }, params);

    // Delete empty questions
    for (var i = this.params.questions.length - 1; i >= 0; i--) {
      if (!this.params.questions[i]) {
        this.params.questions.splice(i, 1);
      }
    }

    // Previous state
    this.contentData = contentData;
    if (this.contentData !== undefined && this.contentData.previousState !== undefined) {
      this.previousState = this.contentData.previousState;
    }

    // Clozes
    this.clozes = [];

    // Keep track tabbing forward or backwards
    this.shiftPressed = false;

    H5P.$body.keydown(function (event) {
      if (event.keyCode === 16) {
        self.shiftPressed = true;
      }
    }).keyup(function (event) {
      if (event.keyCode === 16) {
        self.shiftPressed = false;
      }
    });

    // Using instructions as label for our text groups
    this.labelId = 'h5p-blanks-instructions-' + Blanks.idCounter + '-' + H5P.createUUID();
    this.content = self.createQuestions();

    // Check for task media
    var media = self.params.media;
    if (media && media.type && media.type.library) {
      media = media.type;
      var type = media.library.split(' ')[0];
      if (type === 'H5P.Image') {
        if (media.params.file) {
          // Register task image
          self.setImage(media.params.file.path, {
            disableImageZooming: self.params.media.disableImageZooming || false,
            alt: media.params.alt,
            title: media.params.title,
            expandImage: media.params.expandImage,
            minimizeImage: media.params.minimizeImage
          });
        }
      }
      else if (type === 'H5P.Video') {
        if (media.params.sources) {
          // Register task video
          self.setVideo(media);
        }
      }
      else if (type === 'H5P.Audio') {
        if (media.params.files) {
          // Register task audio
          self.setAudio(media);
        }
      }
    }

    // Register task introduction text
    self.setIntroduction('<div id="' + this.labelId + '">' + self.params.text + '</div>');

    // Register task content area
    self.setContent(self.content, {
      'class': self.params.behaviour.separateLines ? 'h5p-separate-lines' : ''
    });

    // ... and buttons
    self.registerButtons();

    // Restore previous state
    self.setH5PUserState();
  }

  // Inheritance
  Blanks.prototype = Object.create(Question.prototype);
  Blanks.prototype.constructor = Blanks;

  /**
   * Create all the buttons for the task
   */
  Blanks.prototype.registerButtons = function () {
    var self = this;

    var $content = $('[data-content-id="' + self.contentId + '"].h5p-content');
    var $containerParents = $content.parents('.h5p-container');

    // select find container to attach dialogs to
    var $container;
    if ($containerParents.length !== 0) {
      // use parent highest up if any
      $container = $containerParents.last();
    }
    else if ($content.length !== 0) {
      $container = $content;
    }
    else  {
      $container = $(document.body);
    }

    if (!self.params.behaviour.autoCheck && this.params.behaviour.enableCheckButton) {
      // Check answer button
      self.addButton('check-answer', self.params.checkAnswer, function () {
        // Move focus to top of content
        self.a11yHeader.innerHTML = self.params.a11yHeader;
        self.a11yHeader.focus();

        self.toggleButtonVisibility(STATE_CHECKING);
        self.markResults();
        self.showEvaluation();
        self.triggerAnswered();
      }, true, {
        'aria-label': self.params.a11yCheck,
      }, {
        confirmationDialog: {
          enable: self.params.behaviour.confirmCheckDialog,
          l10n: self.params.confirmCheck,
          instance: self,
          $parentElement: $container
        },
        textIfSubmitting: self.params.submitAnswer,
        contentData: self.contentData,
      });
    }

    // Show solution button
    self.addButton('show-solution', self.params.showSolutions, function () {
      self.showCorrectAnswers(false);
    }, self.params.behaviour.enableSolutionsButton, {
      'aria-label': self.params.a11yShowSolution,
    });

    // Try again button
    if (self.params.behaviour.enableRetry === true) {
      self.addButton('try-again', self.params.tryAgain, function () {
        self.a11yHeader.innerHTML = '';
        self.resetTask();
        self.$questions.filter(':first').find('input:first').focus();
      }, true, {
        'aria-label': self.params.a11yRetry,
      }, {
        confirmationDialog: {
          enable: self.params.behaviour.confirmRetryDialog,
          l10n: self.params.confirmRetry,
          instance: self,
          $parentElement: $container
        }
      });
    }
    self.toggleButtonVisibility(STATE_ONGOING);
  };

  /**
   * Find blanks in a string and run a handler on those blanks
   *
   * @param {string} question
   *   Question text containing blanks enclosed in asterisks.
   * @param {function} handler
   *   Replaces the blanks text with an input field.
   * @returns {string}
   *   The question with blanks replaced by the given handler.
   */
  Blanks.prototype.handleBlanks = function (question, handler) {
    // Go through the text and run handler on all asterisk
    var clozeEnd, clozeStart = question.indexOf('*');
    var self = this;
    while (clozeStart !== -1 && clozeEnd !== -1) {
      clozeStart++;
      clozeEnd = question.indexOf('*', clozeStart);
      if (clozeEnd === -1) {
        continue; // No end
      }
      var clozeContent = question.substring(clozeStart, clozeEnd);
      var replacer = '';
      if (clozeContent.length) {
        replacer = handler(self.parseSolution(clozeContent));
        clozeEnd++;
      }
      else {
        clozeStart += 1;
      }
      question = question.slice(0, clozeStart - 1) + replacer + question.slice(clozeEnd);
      clozeEnd -= clozeEnd - clozeStart - replacer.length;

      // Find the next cloze
      clozeStart = question.indexOf('*', clozeEnd);
    }
    return question;
  };

  /**
   * Create questitons html for DOM
   */
  Blanks.prototype.createQuestions = function () {
    var self = this;

    var html = '';
    var clozeNumber = 0;
    for (var i = 0; i < self.params.questions.length; i++) {
      var question = self.params.questions[i];

      // Go through the question text and replace all the asterisks with input fields
      question = self.handleBlanks(question, function (solution) {
        // Create new cloze
        clozeNumber += 1;
        var defaultUserAnswer = (self.params.userAnswers.length > self.clozes.length ? self.params.userAnswers[self.clozes.length] : null);
        var cloze = new Blanks.Cloze(solution, self.params.behaviour, defaultUserAnswer, {
          answeredCorrectly: self.params.answeredCorrectly,
          answeredIncorrectly: self.params.answeredIncorrectly,
          solutionLabel: self.params.solutionLabel,
          inputLabel: self.params.inputLabel,
          inputHasTipLabel: self.params.inputHasTipLabel,
          tipLabel: self.params.tipLabel
        });

        self.clozes.push(cloze);
        return cloze;
      });

      html += '<div role="group" aria-labelledby="' + self.labelId + '">' + question + '</div>';
    }

    self.hasClozes = clozeNumber > 0;
    this.$questions = $(html);

    self.a11yHeader = document.createElement('div');
    self.a11yHeader.classList.add('hidden-but-read');
    self.a11yHeader.tabIndex = -1;
    self.$questions[0].insertBefore(self.a11yHeader, this.$questions[0].childNodes[0] || null);

    // Set input fields.
    this.$questions.find('input').each(function (i) {

      /**
       * Observe resizing of input field, so that we can resize
       * the H5P to fit all content when the input field grows in size
       */
      let resizeTimer;
      new ResizeObserver(function () {
        // To avoid triggering resize too often, we wait a second after the last 
        // resize event has been received
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          self.trigger('resize');
        }, 1000);
      }).observe(this);

      var afterCheck;
      if (self.params.behaviour.autoCheck) {
        afterCheck = function () {
          var answer = $("<div>").text(this.getUserAnswer()).html();
          self.read((this.correct() ? self.params.answerIsCorrect : self.params.answerIsWrong).replace(':ans', answer));
          if (self.done || self.allBlanksFilledOut()) {
            // All answers has been given. Show solutions button.
            self.toggleButtonVisibility(STATE_CHECKING);
            self.showEvaluation();
            self.triggerAnswered();
            self.done = true;
          }
        };
      }
      self.clozes[i].setInput($(this), afterCheck, function () {
        self.toggleButtonVisibility(STATE_ONGOING);
        if (!self.params.behaviour.autoCheck) {
          self.hideEvaluation();
        }
      }, i, self.clozes.length);
    }).keydown(function (event) {
      var $this = $(this);

      // Adjust width of text input field to match value
      self.autoGrowTextField($this);

      var $inputs, isLastInput;
      var enterPressed = (event.keyCode === 13);
      var tabPressedAutoCheck = (event.keyCode === 9 && self.params.behaviour.autoCheck);

      if (enterPressed || tabPressedAutoCheck) {
        // Figure out which inputs are left to answer
        $inputs = self.$questions.find('.h5p-input-wrapper:not(.h5p-correct) .h5p-text-input');

        // Figure out if this is the last input
        isLastInput = $this.is($inputs[$inputs.length - 1]);
      }

      if ((tabPressedAutoCheck && isLastInput && !self.shiftPressed) ||
          (enterPressed && isLastInput)) {
        // Focus first button on next tick
        setTimeout(function () {
          self.focusButton();
        }, 10);
      }

      if (enterPressed) {
        if (isLastInput) {
          // Check answers
          $this.trigger('blur');
        }
        else {
          // Find next input to focus
          $inputs.eq($inputs.index($this) + 1).focus();
        }

        return false; // Prevent form submission on enter key
      }
    }).on('change', function () {
      self.answered = true;
      self.triggerXAPI('interacted');
    });

    self.on('resize', function () {
      self.resetGrowTextField();
    });

    return this.$questions;
  };

  /**
   *
   */
  Blanks.prototype.autoGrowTextField = function ($input) {
    // Do not set text field size when separate lines is enabled
    if (this.params.behaviour.separateLines) {
      return;
    }

    var self = this;
    var fontSize = parseInt($input.css('font-size'), 10);
    var minEm = 3;
    var minPx = fontSize * minEm;
    var rightPadEm = 3.25;
    var rightPadPx = fontSize * rightPadEm;
    var static_min_pad = 0.5 * fontSize;

    setTimeout(function () {
      var tmp = $('<div>', {
        'text': $input.val()
      });
      tmp.css({
        'position': 'absolute',
        'white-space': 'nowrap',
        'font-size': $input.css('font-size'),
        'font-family': $input.css('font-family'),
        'padding': $input.css('padding'),
        'width': 'initial'
      });
      $input.parent().append(tmp);
      var width = tmp.width();
      var parentWidth = self.$questions.width();
      tmp.remove();
      if (width <= minPx) {
        // Apply min width
        $input.width(minPx + static_min_pad);
      }
      else if (width + rightPadPx >= parentWidth) {
        // Apply max width of parent
        $input.width(parentWidth - rightPadPx);
      }
      else {
        // Apply width that wraps input
        $input.width(width + static_min_pad);
      }
    }, 1);
  };

  /**
   * Resize all text field growth to current size.
   */
  Blanks.prototype.resetGrowTextField = function () {
    var self = this;

    this.$questions.find('input').each(function () {
      self.autoGrowTextField($(this));
    });
  };

  /**
   * Toggle buttons dependent of state.
   *
   * Using CSS-rules to conditionally show/hide using the data-attribute [data-state]
   */
  Blanks.prototype.toggleButtonVisibility = function (state) {
    // The show solutions button is hidden if all answers are correct
    var allCorrect = (this.getScore() === this.getMaxScore());
    if (this.params.behaviour.autoCheck && allCorrect) {
      // We are viewing the solutions
      state = STATE_FINISHED;
    }

    if (this.params.behaviour.enableSolutionsButton) {
      if (state === STATE_CHECKING && !allCorrect) {
        this.showButton('show-solution');
      }
      else {
        this.hideButton('show-solution');
      }
    }

    if (this.params.behaviour.enableRetry) {
      if ((state === STATE_CHECKING && !allCorrect) || state === STATE_SHOWING_SOLUTION) {
        this.showButton('try-again');
      }
      else {
        this.hideButton('try-again');
      }
    }

    if (state === STATE_ONGOING) {
      this.showButton('check-answer');
    }
    else {
      this.hideButton('check-answer');
    }

    this.trigger('resize');
  };

  /**
   * Check if solution is allowed. Warn user if not
   */
  Blanks.prototype.allowSolution = function () {
    if (this.params.behaviour.showSolutionsRequiresInput === true) {
      if (!this.allBlanksFilledOut()) {
        this.updateFeedbackContent(this.params.notFilledOut);
        this.read(this.params.notFilledOut);
        return false;
      }
    }
    return true;
  };

  /**
   * Check if all blanks are filled out
   *
   * @method allBlanksFilledOut
   * @return {boolean} Returns true if all blanks are filled out.
   */
  Blanks.prototype.allBlanksFilledOut = function () {
    return !this.clozes.some(function (cloze) {
      return !cloze.filledOut();
    });
  };

  /**
   * Mark which answers are correct and which are wrong and disable fields if retry is off.
   */
  Blanks.prototype.markResults = function () {
    var self = this;
    for (var i = 0; i < self.clozes.length; i++) {
      self.clozes[i].checkAnswer();
      if (!self.params.behaviour.enableRetry) {
        self.clozes[i].disableInput();
      }
    }
    this.trigger('resize');
  };

  /**
   * Removed marked results
   */
  Blanks.prototype.removeMarkedResults = function () {
    this.$questions.find('.h5p-input-wrapper').removeClass('h5p-correct h5p-wrong');
    this.$questions.find('.h5p-input-wrapper > input').attr('disabled', false);
    this.trigger('resize');
  };


  /**
   * Displays the correct answers
   * @param {boolean} [alwaysShowSolution]
   *  Will always show solution if true
   */
  Blanks.prototype.showCorrectAnswers = function (alwaysShowSolution) {
    if (!alwaysShowSolution && !this.allowSolution()) {
      return;
    }

    this.toggleButtonVisibility(STATE_SHOWING_SOLUTION);
    this.hideSolutions();

    for (var i = 0; i < this.clozes.length; i++) {
      this.clozes[i].showSolution();
    }
    this.trigger('resize');
  };

  /**
   * Toggle input allowed for all input fields
   *
   * @method function
   * @param  {boolean} enabled True if fields should allow input, otherwise false
   */
  Blanks.prototype.toggleAllInputs = function (enabled) {
    for (var i = 0; i < this.clozes.length; i++) {
      this.clozes[i].toggleInput(enabled);
    }
  };

  /**
   * Display the correct solution for the input boxes.
   *
   * This is invoked from CP and QS - be carefull!
   */
  Blanks.prototype.showSolutions = function () {
    this.params.behaviour.enableSolutionsButton = true;
    this.toggleButtonVisibility(STATE_FINISHED);
    this.markResults();
    this.showEvaluation();
    this.showCorrectAnswers(true);
    this.toggleAllInputs(false);
    //Hides all buttons in "show solution" mode.
    this.hideButtons();
  };

  /**
   * Resets the complete task.
   * Used in contracts.
   * @public
   */
  Blanks.prototype.resetTask = function () {
    this.answered = false;
    this.hideEvaluation();
    this.hideSolutions();
    this.clearAnswers();
    this.removeMarkedResults();
    this.toggleButtonVisibility(STATE_ONGOING);
    this.resetGrowTextField();
    this.toggleAllInputs(true);
    this.done = false;
  };

  /**
   * Hides all buttons.
   * @public
   */
  Blanks.prototype.hideButtons = function () {
    this.toggleButtonVisibility(STATE_FINISHED);
  };

  /**
   * Trigger xAPI answered event
   */
  Blanks.prototype.triggerAnswered = function () {
    this.answered = true;
    var xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    this.trigger(xAPIEvent);
  };

  /**
   * Get xAPI data.
   * Contract used by report rendering engine.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  Blanks.prototype.getXAPIData = function () {
    var xAPIEvent = this.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    return {
      statement: xAPIEvent.data.statement
    };
  };

  /**
   * Generate xAPI object definition used in xAPI statements.
   * @return {Object}
   */
  Blanks.prototype.getxAPIDefinition = function () {
    var definition = {};
    // The below replaceAll makes sure we don't get any unwanted XAPI_PLACEHOLDERs in the description
    definition.description = {
      'en-US': this.params.text.replaceAll(/_{10,}/gi, '_________')
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'fill-in';

    const clozeSolutions = [];
    let crp = '';
    // xAPI forces us to create solution patterns for all possible solution combinations
    for (var i = 0; i < this.params.questions.length; i++) {
      // The below replaceAll makes sure we don't get any unwanted XAPI_PLACEHOLDERs in the questions
      let question = this.params.questions[i].replaceAll(/_{10,}/gi, '_________');

      question = this.handleBlanks(question, function (solution) {
        // Collect all solution combinations for the H5P Alternative extension
        clozeSolutions.push(solution.solutions);

        // Create a basic response pattern out of the first alternative for each blanks field
        crp += (!crp ? '' : '[,]') + solution.solutions[0];

        // We replace the solutions in the question with a "blank"
        return '__________';
      });
      definition.description['en-US'] += question;
    }

    // Set the basic response pattern (not supporting multiple alternatives for blanks)
    definition.correctResponsesPattern = [
      '{case_matters=' + this.params.behaviour.caseSensitive + '}' + crp,
    ];

    // Add the H5P Alternative extension which provides all the combinations of different answers
    // Reporting software will need to support this extension for alternatives to work.
    definition.extensions = definition.extensions || {};
    definition.extensions[XAPI_CASE_SENSITIVITY] = this.params.behaviour.caseSensitive;
    definition.extensions[XAPI_ALTERNATIVE_EXTENSION] = clozeSolutions;

    return definition;
  };

  /**
   * Add the question itselt to the definition part of an xAPIEvent
   */
  Blanks.prototype.addQuestionToXAPI = function (xAPIEvent) {
    var definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    $.extend(true, definition, this.getxAPIDefinition());

    // Set reporting module version if alternative extension is used
    if (this.hasAlternatives) {
      const context = xAPIEvent.getVerifiedStatementValue(['context']);
      context.extensions = context.extensions || {};
      context.extensions[XAPI_REPORTING_VERSION_EXTENSION] = '1.1.0';
    }
  };

  /**
   * Parse the solution text (text between the asterisks)
   *
   * @param {string} solutionText
   * @returns {object} with the following properties
   *  - tip: the tip text for this solution, undefined if no tip
   *  - solutions: array of solution words
   */
  Blanks.prototype.parseSolution = function (solutionText) {
    var tip, solution;

    var tipStart = solutionText.indexOf(':');
    if (tipStart !== -1) {
      // Found tip, now extract
      tip = solutionText.slice(tipStart + 1);
      solution = solutionText.slice(0, tipStart);
    }
    else {
      solution = solutionText;
    }

    // Split up alternatives
    var solutions = solution.split('/');
    this.hasAlternatives = this.hasAlternatives || solutions.length > 1;

    // Trim solutions
    for (var i = 0; i < solutions.length; i++) {
      solutions[i] = H5P.trim(solutions[i]);

      //decodes html entities
      var elem = document.createElement('textarea');
      elem.innerHTML = solutions[i];
      solutions[i] = elem.value;
    }

    return {
      tip: tip,
      solutions: solutions
    };
  };

  /**
   * Add the response part to an xAPI event
   *
   * @param {H5P.XAPIEvent} xAPIEvent
   *  The xAPI event we will add a response to
   */
  Blanks.prototype.addResponseToXAPI = function (xAPIEvent) {
    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this);
    xAPIEvent.data.statement.result.response = this.getxAPIResponse();
  };

  /**
   * Generate xAPI user response, used in xAPI statements.
   * @return {string} User answers separated by the "[,]" pattern
   */
  Blanks.prototype.getxAPIResponse = function () {
    var usersAnswers = this.getCurrentState();
    return usersAnswers.join('[,]');
  };

  /**
   * Show evaluation widget, i.e: 'You got x of y blanks correct'
   */
  Blanks.prototype.showEvaluation = function () {
    var maxScore = this.getMaxScore();
    var score = this.getScore();
    var scoreText = H5P.Question.determineOverallFeedback(this.params.overallFeedback, score / maxScore).replace('@score', score).replace('@total', maxScore);

    this.setFeedback(scoreText, score, maxScore, this.params.scoreBarLabel);

    if (score === maxScore) {
      this.toggleButtonVisibility(STATE_FINISHED);
    }
  };

  /**
   * Hide the evaluation widget
   */
  Blanks.prototype.hideEvaluation = function () {
    // Clear evaluation section.
    this.removeFeedback();
  };

  /**
   * Hide solutions. (/try again)
   */
  Blanks.prototype.hideSolutions = function () {
    // Clean solution from quiz
    this.$questions.find('.h5p-correct-answer').remove();
  };

  /**
   * Get maximum number of correct answers.
   *
   * @returns {Number} Max points
   */
  Blanks.prototype.getMaxScore = function () {
    var self = this;
    return self.clozes.length;
  };

  /**
   * Count the number of correct answers.
   *
   * @returns {Number} Points
   */
  Blanks.prototype.getScore = function () {
    var self = this;
    var correct = 0;
    for (var i = 0; i < self.clozes.length; i++) {
      if (self.clozes[i].correct()) {
        correct++;
      }
      self.params.userAnswers[i] = self.clozes[i].getUserAnswer();
    }

    return correct;
  };

  Blanks.prototype.getTitle = function () {
    return H5P.createTitle((this.contentData.metadata && this.contentData.metadata.title) ? this.contentData.metadata.title : 'Fill In');
  };

  /**
   * Clear the user's answers
   */
  Blanks.prototype.clearAnswers = function () {
    this.clozes.forEach(function (cloze) {
      cloze.setUserInput('');
      cloze.resetAriaLabel();
    });
  };

  /**
   * Checks if all has been answered.
   *
   * @returns {Boolean}
   */
  Blanks.prototype.getAnswerGiven = function () {
    return this.answered || !this.hasClozes;
  };

  /**
   * Helps set focus the given input field.
   * @param {jQuery} $input
   */
  Blanks.setFocus = function ($input) {
    setTimeout(function () {
      $input.focus();
    }, 1);
  };

  /**
   * Returns an object containing content of each cloze
   *
   * @returns {object} object containing content for each cloze
   */
  Blanks.prototype.getCurrentState = function () {
    var clozesContent = [];

    // Get user input for every cloze
    this.clozes.forEach(function (cloze) {
      clozesContent.push(cloze.getUserAnswer());
    });
    return clozesContent;
  };

  /**
   * Sets answers to current user state
   */
  Blanks.prototype.setH5PUserState = function () {
    var self = this;
    var isValidState = (this.previousState !== undefined &&
                        this.previousState.length &&
                        this.previousState.length === this.clozes.length);

    // Check that stored user state is valid
    if (!isValidState) {
      return;
    }

    // Set input from user state
    var hasAllClozesFilled = true;
    this.previousState.forEach(function (clozeContent, ccIndex) {

      // Register that an answer has been given
      if (clozeContent.length) {
        self.answered = true;
      }

      var cloze = self.clozes[ccIndex];
      cloze.setUserInput(clozeContent);

      // Handle instant feedback
      if (self.params.behaviour.autoCheck) {
        if (cloze.filledOut()) {
          cloze.checkAnswer();
        }
        else {
          hasAllClozesFilled = false;
        }
      }
    });

    if (self.params.behaviour.autoCheck && hasAllClozesFilled) {
      self.showEvaluation();
      self.toggleButtonVisibility(STATE_CHECKING);
    }
  };

  /**
   * Disables any active input. Useful for freezing the task and dis-allowing
   * modification of wrong answers.
   */
  Blanks.prototype.disableInput = function () {
    this.$questions.find('input').attr('disabled', true);
  };

  Blanks.idCounter = 0;

  return Blanks;
})(H5P.jQuery, H5P.Question);

/**
 * Static utility method for parsing H5P.Blanks qestion into a format useful
 * for creating reports.
 *
 * Example question: 'H5P content may be edited using a *browser/web-browser:something you use every day*.'
 *
 * Produces the following result:
 * [
 *   {
 *     type: 'text',
 *     content: 'H5P content may be edited using a '
 *   },
 *   {
 *     type: 'answer',
 *     correct: ['browser', 'web-browser']
 *   },
 *   {
 *     type: 'text',
 *     content: '.'
 *   }
 * ]
 *
 * @param {string} question
 */
H5P.Blanks.parseText = function (question) {
  var blank = new H5P.Blanks({ question: question });

  /**
   * Parses a text into an array where words starting and ending
   * with an asterisk are separated from other text.
   * e.g ["this", "*is*", " an ", "*example*"]
   *
   * @param {string} text
   *
   * @return {string[]}
   */
  function tokenizeQuestionText(text) {
    return text.split(/(\*.*?\*)/).filter(function (str) {
      return str.length > 0; }
    );
  }

  function startsAndEndsWithAnAsterisk(str) {
    return str.substr(0,1) === '*' && str.substr(-1) === '*';
  }

  function replaceHtmlTags(str, value) {
    return str.replace(/<[^>]*>/g, value);
  }

  return tokenizeQuestionText(replaceHtmlTags(question, '')).map(function (part) {
    return startsAndEndsWithAnAsterisk(part) ?
      ({
        type: 'answer',
        correct: blank.parseSolution(part.slice(1, -1)).solutions
      }) :
      ({
        type: 'text',
        content: part
      });
  });
};
;
(function ($, Blanks) {

  /**
   * Simple private class for keeping track of clozes.
   *
   * @class H5P.Blanks.Cloze
   * @param {string} answer
   * @param {Object} behaviour Behavioral settings for the task from semantics
   * @param {boolean} behaviour.acceptSpellingErrors - If true, answers will also count correct if they contain small spelling errors.
   * @param {string} defaultUserAnswer
   * @param {Object} l10n Localized texts
   * @param {string} l10n.solutionLabel Assistive technology label for cloze solution
   * @param {string} l10n.inputLabel Assistive technology label for cloze input
   * @param {string} l10n.inputHasTipLabel Assistive technology label for input with tip
   * @param {string} l10n.tipLabel Label for tip icon
   */
  Blanks.Cloze = function (solution, behaviour, defaultUserAnswer, l10n) {
    var self = this;
    var $input, $wrapper;
    var answers = solution.solutions;
    var answer = answers.join('/');
    var tip = solution.tip;
    var checkedAnswer = null;
    var inputLabel = l10n.inputLabel;

    if (behaviour.caseSensitive !== true) {
      // Convert possible solutions into lowercase
      for (var i = 0; i < answers.length; i++) {
        answers[i] = answers[i].toLowerCase();
      }
    }

    /**
     * Check if the answer is correct.
     *
     * @private
     * @param {string} answered
     */
    var correct = function (answered) {
      if (behaviour.caseSensitive !== true) {
        answered = answered.toLowerCase();
      }
      for (var i = 0; i < answers.length; i++) {
        // Damerau-Levenshtein comparison
        if (behaviour.acceptSpellingErrors === true) {
          var levenshtein = H5P.TextUtilities.computeLevenshteinDistance(answered, H5P.trim(answers[i]), true);
          /*
           * The correctness is temporarily computed by word length and number of number of operations
           * required to change one word into the other (Damerau-Levenshtein). It's subject to
           * change, cmp. https://github.com/otacke/udacity-machine-learning-engineer/blob/master/submissions/capstone_proposals/h5p_fuzzy_blanks.md
           */
          if ((answers[i].length > 9) && (levenshtein <= 2)) {
            return true;
          } else if ((answers[i].length > 3) && (levenshtein <= 1)) {
            return true;
          }
        }
        // regular comparison
        if (answered === H5P.trim(answers[i])) {
          return true;
        }
      }
      return false;
    };

    /**
     * Check if filled out.
     *
     * @param {boolean}
     */
    this.filledOut = function () {
      var answered = this.getUserAnswer();
      // Blank can be correct and is interpreted as filled out.
      return (answered !== '' || correct(answered));
    };

    /**
     * Check the cloze and mark it as wrong or correct.
     */
    this.checkAnswer = function () {
      checkedAnswer = this.getUserAnswer();
      var isCorrect = correct(checkedAnswer);
      if (isCorrect) {
        $wrapper.addClass('h5p-correct');
        $input.attr('disabled', true)
          .attr('aria-label', inputLabel + '. ' + l10n.answeredCorrectly);
      }
      else {
        $wrapper.addClass('h5p-wrong');
        $input.attr('aria-label', inputLabel + '. ' + l10n.answeredIncorrectly);
      }
    };

    /**
     * Disables input.
     * @method disableInput
     */
    this.disableInput = function () {
      this.toggleInput(false);
    };

    /**
     * Enables input.
     * @method enableInput
     */
    this.enableInput = function () {
      this.toggleInput(true);
    };

    /**
     * Toggles input enable/disable
     * @method toggleInput
     * @param  {boolean}   enabled True if input should be enabled, otherwise false
     */
    this.toggleInput = function (enabled) {
      $input.attr('disabled', !enabled);
    };

    /**
     * Show the correct solution.
     */
    this.showSolution = function () {
      if (correct(this.getUserAnswer())) {
        return; // Only for the wrong ones
      }

      $('<span>', {
        'aria-hidden': true,
        'class': 'h5p-correct-answer',
        text: H5P.trim(answer.replace(/\s*\/\s*/g, '/')),
        insertAfter: $wrapper
      });
      $input.attr('disabled', true);
      var ariaLabel = inputLabel + '. ' +
        l10n.solutionLabel + ' ' + answer + '. ' +
        l10n.answeredIncorrectly;

      $input.attr('aria-label', ariaLabel);
    };

    /**
     * @returns {boolean}
     */
    this.correct = function () {
      return correct(this.getUserAnswer());
    };

    /**
     * Set input element.
     *
     * @param {H5P.jQuery} $element
     * @param {function} afterCheck
     * @param {function} afterFocus
     * @param {number} clozeIndex Index of cloze
     * @param {number} totalCloze Total amount of clozes in blanks
     */
    this.setInput = function ($element, afterCheck, afterFocus, clozeIndex, totalCloze) {
      $input = $element;
      $wrapper = $element.parent();
      inputLabel = inputLabel.replace('@num', (clozeIndex + 1))
        .replace('@total', totalCloze);

      // Add tip if tip is set
      if(tip !== undefined && tip.trim().length > 0) {
        $wrapper.addClass('has-tip')
          .append(H5P.JoubelUI.createTip(tip, {
            tipLabel: l10n.tipLabel
          }));
        inputLabel += '. ' + l10n.inputHasTipLabel;
      }

      $input.attr('aria-label', inputLabel);

      if (afterCheck !== undefined) {
        $input.blur(function () {
          if (self.filledOut()) {
            // Check answers
            if (!behaviour.enableRetry) {
              self.disableInput();
            }
            self.checkAnswer();
            afterCheck.apply(self);
          }
        });
      }
      $input.keyup(function () {
        if (checkedAnswer !== null && checkedAnswer !== self.getUserAnswer()) {
          // The Answer has changed since last check
          checkedAnswer = null;
          $wrapper.removeClass('h5p-wrong');
          $input.attr('aria-label', inputLabel);
          if (afterFocus !== undefined) {
            afterFocus();
          }
        }
      });
    };

    /**
     * @returns {string} Cloze html
     */
    this.toString = function () {
      var extra = defaultUserAnswer ? ' value="' + defaultUserAnswer + '"' : '';
      var result = '<span class="h5p-input-wrapper"><input type="text" class="h5p-text-input" autocomplete="off" autocapitalize="off" spellcheck="false"' + extra + '></span>';
      self.length = result.length;
      return result;
    };

    /**
     * @returns {string} Trimmed answer
     */
    this.getUserAnswer = function () {
      const trimmedAnswer = H5P.trim($input.val().replace(/\&nbsp;/g, ' '));
      // Set trimmed answer
      $input.val(trimmedAnswer);
      if (behaviour.formulaEditor) {
        // If fomula editor is enabled set trimmed text 
        $input.parent().find('.wiris-h5p-input').html(trimmedAnswer);
      }
      return trimmedAnswer;
    };

    /**
     * @param {string} text New input text
     */
    this.setUserInput = function (text) {
      $input.val(text);
    };

    /**
     * Resets aria label of input field
     */
    this.resetAriaLabel = function () {
      $input.attr('aria-label', inputLabel);
    };
  };

})(H5P.jQuery, H5P.Blanks);
;
/*! For license information please see h5p-interactive-book.js.LICENSE.txt */
(()=>{var t={9552:t=>{"use strict";t.exports={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]}},6855:(t,e,r)=>{var n=r(9552),a=r(521),o=Object.hasOwnProperty,i=Object.create(null);for(var s in n)o.call(n,s)&&(i[n[s]]=s);var c=t.exports={to:{},get:{}};function u(t,e,r){return Math.min(Math.max(e,t),r)}function l(t){var e=Math.round(t).toString(16).toUpperCase();return e.length<2?"0"+e:e}c.get=function(t){var e,r;switch(t.substring(0,3).toLowerCase()){case"hsl":e=c.get.hsl(t),r="hsl";break;case"hwb":e=c.get.hwb(t),r="hwb";break;default:e=c.get.rgb(t),r="rgb"}return e?{model:r,value:e}:null},c.get.rgb=function(t){if(!t)return null;var e,r,a,i=[0,0,0,1];if(e=t.match(/^#([a-f0-9]{6})([a-f0-9]{2})?$/i)){for(a=e[2],e=e[1],r=0;r<3;r++){var s=2*r;i[r]=parseInt(e.slice(s,s+2),16)}a&&(i[3]=parseInt(a,16)/255)}else if(e=t.match(/^#([a-f0-9]{3,4})$/i)){for(a=(e=e[1])[3],r=0;r<3;r++)i[r]=parseInt(e[r]+e[r],16);a&&(i[3]=parseInt(a+a,16)/255)}else if(e=t.match(/^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/)){for(r=0;r<3;r++)i[r]=parseInt(e[r+1],0);e[4]&&(e[5]?i[3]=.01*parseFloat(e[4]):i[3]=parseFloat(e[4]))}else{if(!(e=t.match(/^rgba?\(\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/)))return(e=t.match(/^(\w+)$/))?"transparent"===e[1]?[0,0,0,0]:o.call(n,e[1])?((i=n[e[1]])[3]=1,i):null:null;for(r=0;r<3;r++)i[r]=Math.round(2.55*parseFloat(e[r+1]));e[4]&&(e[5]?i[3]=.01*parseFloat(e[4]):i[3]=parseFloat(e[4]))}for(r=0;r<3;r++)i[r]=u(i[r],0,255);return i[3]=u(i[3],0,1),i},c.get.hsl=function(t){if(!t)return null;var e=t.match(/^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:[,|\/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/);if(e){var r=parseFloat(e[4]);return[(parseFloat(e[1])%360+360)%360,u(parseFloat(e[2]),0,100),u(parseFloat(e[3]),0,100),u(isNaN(r)?1:r,0,1)]}return null},c.get.hwb=function(t){if(!t)return null;var e=t.match(/^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/);if(e){var r=parseFloat(e[4]);return[(parseFloat(e[1])%360+360)%360,u(parseFloat(e[2]),0,100),u(parseFloat(e[3]),0,100),u(isNaN(r)?1:r,0,1)]}return null},c.to.hex=function(){var t=a(arguments);return"#"+l(t[0])+l(t[1])+l(t[2])+(t[3]<1?l(Math.round(255*t[3])):"")},c.to.rgb=function(){var t=a(arguments);return t.length<4||1===t[3]?"rgb("+Math.round(t[0])+", "+Math.round(t[1])+", "+Math.round(t[2])+")":"rgba("+Math.round(t[0])+", "+Math.round(t[1])+", "+Math.round(t[2])+", "+t[3]+")"},c.to.rgb.percent=function(){var t=a(arguments),e=Math.round(t[0]/255*100),r=Math.round(t[1]/255*100),n=Math.round(t[2]/255*100);return t.length<4||1===t[3]?"rgb("+e+"%, "+r+"%, "+n+"%)":"rgba("+e+"%, "+r+"%, "+n+"%, "+t[3]+")"},c.to.hsl=function(){var t=a(arguments);return t.length<4||1===t[3]?"hsl("+t[0]+", "+t[1]+"%, "+t[2]+"%)":"hsla("+t[0]+", "+t[1]+"%, "+t[2]+"%, "+t[3]+")"},c.to.hwb=function(){var t=a(arguments),e="";return t.length>=4&&1!==t[3]&&(e=", "+t[3]),"hwb("+t[0]+", "+t[1]+"%, "+t[2]+"%"+e+")"},c.to.keyword=function(t){return i[t.slice(0,3)]}},7124:(t,e,r)=>{const n=r(6855),a=r(7747),o=["keyword","gray","hex"],i={};for(const t of Object.keys(a))i[[...a[t].labels].sort().join("")]=t;const s={};function c(t,e){if(!(this instanceof c))return new c(t,e);if(e&&e in o&&(e=null),e&&!(e in a))throw new Error("Unknown model: "+e);let r,u;if(null==t)this.model="rgb",this.color=[0,0,0],this.valpha=1;else if(t instanceof c)this.model=t.model,this.color=[...t.color],this.valpha=t.valpha;else if("string"==typeof t){const e=n.get(t);if(null===e)throw new Error("Unable to parse color from string: "+t);this.model=e.model,u=a[this.model].channels,this.color=e.value.slice(0,u),this.valpha="number"==typeof e.value[u]?e.value[u]:1}else if(t.length>0){this.model=e||"rgb",u=a[this.model].channels;const r=Array.prototype.slice.call(t,0,u);this.color=h(r,u),this.valpha="number"==typeof t[u]?t[u]:1}else if("number"==typeof t)this.model="rgb",this.color=[t>>16&255,t>>8&255,255&t],this.valpha=1;else{this.valpha=1;const e=Object.keys(t);"alpha"in t&&(e.splice(e.indexOf("alpha"),1),this.valpha="number"==typeof t.alpha?t.alpha:0);const n=e.sort().join("");if(!(n in i))throw new Error("Unable to parse color from object: "+JSON.stringify(t));this.model=i[n];const{labels:o}=a[this.model],s=[];for(r=0;r<o.length;r++)s.push(t[o[r]]);this.color=h(s)}if(s[this.model])for(u=a[this.model].channels,r=0;r<u;r++){const t=s[this.model][r];t&&(this.color[r]=t(this.color[r]))}this.valpha=Math.max(0,Math.min(1,this.valpha)),Object.freeze&&Object.freeze(this)}c.prototype={toString(){return this.string()},toJSON(){return this[this.model]()},string(t){let e=this.model in n.to?this:this.rgb();e=e.round("number"==typeof t?t:1);const r=1===e.valpha?e.color:[...e.color,this.valpha];return n.to[e.model](r)},percentString(t){const e=this.rgb().round("number"==typeof t?t:1),r=1===e.valpha?e.color:[...e.color,this.valpha];return n.to.rgb.percent(r)},array(){return 1===this.valpha?[...this.color]:[...this.color,this.valpha]},object(){const t={},{channels:e}=a[this.model],{labels:r}=a[this.model];for(let n=0;n<e;n++)t[r[n]]=this.color[n];return 1!==this.valpha&&(t.alpha=this.valpha),t},unitArray(){const t=this.rgb().color;return t[0]/=255,t[1]/=255,t[2]/=255,1!==this.valpha&&t.push(this.valpha),t},unitObject(){const t=this.rgb().object();return t.r/=255,t.g/=255,t.b/=255,1!==this.valpha&&(t.alpha=this.valpha),t},round(t){return t=Math.max(t||0,0),new c([...this.color.map(u(t)),this.valpha],this.model)},alpha(t){return void 0!==t?new c([...this.color,Math.max(0,Math.min(1,t))],this.model):this.valpha},red:l("rgb",0,p(255)),green:l("rgb",1,p(255)),blue:l("rgb",2,p(255)),hue:l(["hsl","hsv","hsl","hwb","hcg"],0,(t=>(t%360+360)%360)),saturationl:l("hsl",1,p(100)),lightness:l("hsl",2,p(100)),saturationv:l("hsv",1,p(100)),value:l("hsv",2,p(100)),chroma:l("hcg",1,p(100)),gray:l("hcg",2,p(100)),white:l("hwb",1,p(100)),wblack:l("hwb",2,p(100)),cyan:l("cmyk",0,p(100)),magenta:l("cmyk",1,p(100)),yellow:l("cmyk",2,p(100)),black:l("cmyk",3,p(100)),x:l("xyz",0,p(95.047)),y:l("xyz",1,p(100)),z:l("xyz",2,p(108.833)),l:l("lab",0,p(100)),a:l("lab",1),b:l("lab",2),keyword(t){return void 0!==t?new c(t):a[this.model].keyword(this.color)},hex(t){return void 0!==t?new c(t):n.to.hex(this.rgb().round().color)},hexa(t){if(void 0!==t)return new c(t);const e=this.rgb().round().color;let r=Math.round(255*this.valpha).toString(16).toUpperCase();return 1===r.length&&(r="0"+r),n.to.hex(e)+r},rgbNumber(){const t=this.rgb().color;return(255&t[0])<<16|(255&t[1])<<8|255&t[2]},luminosity(){const t=this.rgb().color,e=[];for(const[r,n]of t.entries()){const t=n/255;e[r]=t<=.04045?t/12.92:((t+.055)/1.055)**2.4}return.2126*e[0]+.7152*e[1]+.0722*e[2]},contrast(t){const e=this.luminosity(),r=t.luminosity();return e>r?(e+.05)/(r+.05):(r+.05)/(e+.05)},level(t){const e=this.contrast(t);return e>=7?"AAA":e>=4.5?"AA":""},isDark(){const t=this.rgb().color;return(2126*t[0]+7152*t[1]+722*t[2])/1e4<128},isLight(){return!this.isDark()},negate(){const t=this.rgb();for(let e=0;e<3;e++)t.color[e]=255-t.color[e];return t},lighten(t){const e=this.hsl();return e.color[2]+=e.color[2]*t,e},darken(t){const e=this.hsl();return e.color[2]-=e.color[2]*t,e},saturate(t){const e=this.hsl();return e.color[1]+=e.color[1]*t,e},desaturate(t){const e=this.hsl();return e.color[1]-=e.color[1]*t,e},whiten(t){const e=this.hwb();return e.color[1]+=e.color[1]*t,e},blacken(t){const e=this.hwb();return e.color[2]+=e.color[2]*t,e},grayscale(){const t=this.rgb().color,e=.3*t[0]+.59*t[1]+.11*t[2];return c.rgb(e,e,e)},fade(t){return this.alpha(this.valpha-this.valpha*t)},opaquer(t){return this.alpha(this.valpha+this.valpha*t)},rotate(t){const e=this.hsl();let r=e.color[0];return r=(r+t)%360,r=r<0?360+r:r,e.color[0]=r,e},mix(t,e){if(!t||!t.rgb)throw new Error('Argument to "mix" was not a Color instance, but rather an instance of '+typeof t);const r=t.rgb(),n=this.rgb(),a=void 0===e?.5:e,o=2*a-1,i=r.alpha()-n.alpha(),s=((o*i==-1?o:(o+i)/(1+o*i))+1)/2,u=1-s;return c.rgb(s*r.red()+u*n.red(),s*r.green()+u*n.green(),s*r.blue()+u*n.blue(),r.alpha()*a+n.alpha()*(1-a))}};for(const t of Object.keys(a)){if(o.includes(t))continue;const{channels:e}=a[t];c.prototype[t]=function(...e){return this.model===t?new c(this):e.length>0?new c(e,t):new c([...(r=a[this.model][t].raw(this.color),Array.isArray(r)?r:[r]),this.valpha],t);var r},c[t]=function(...r){let n=r[0];return"number"==typeof n&&(n=h(r,e)),new c(n,t)}}function u(t){return function(e){return function(t,e){return Number(t.toFixed(e))}(e,t)}}function l(t,e,r){t=Array.isArray(t)?t:[t];for(const n of t)(s[n]||(s[n]=[]))[e]=r;return t=t[0],function(n){let a;return void 0!==n?(r&&(n=r(n)),a=this[t](),a.color[e]=n,a):(a=this[t]().color[e],r&&(a=r(a)),a)}}function p(t){return function(e){return Math.max(0,Math.min(t,e))}}function h(t,e){for(let r=0;r<e;r++)"number"!=typeof t[r]&&(t[r]=0);return t}t.exports=c},5043:(t,e,r)=>{const n=r(1086),a={};for(const t of Object.keys(n))a[n[t]]=t;const o={rgb:{channels:3,labels:"rgb"},hsl:{channels:3,labels:"hsl"},hsv:{channels:3,labels:"hsv"},hwb:{channels:3,labels:"hwb"},cmyk:{channels:4,labels:"cmyk"},xyz:{channels:3,labels:"xyz"},lab:{channels:3,labels:"lab"},lch:{channels:3,labels:"lch"},hex:{channels:1,labels:["hex"]},keyword:{channels:1,labels:["keyword"]},ansi16:{channels:1,labels:["ansi16"]},ansi256:{channels:1,labels:["ansi256"]},hcg:{channels:3,labels:["h","c","g"]},apple:{channels:3,labels:["r16","g16","b16"]},gray:{channels:1,labels:["gray"]}};t.exports=o;for(const t of Object.keys(o)){if(!("channels"in o[t]))throw new Error("missing channels property: "+t);if(!("labels"in o[t]))throw new Error("missing channel labels property: "+t);if(o[t].labels.length!==o[t].channels)throw new Error("channel and label counts mismatch: "+t);const{channels:e,labels:r}=o[t];delete o[t].channels,delete o[t].labels,Object.defineProperty(o[t],"channels",{value:e}),Object.defineProperty(o[t],"labels",{value:r})}o.rgb.hsl=function(t){const e=t[0]/255,r=t[1]/255,n=t[2]/255,a=Math.min(e,r,n),o=Math.max(e,r,n),i=o-a;let s,c;o===a?s=0:e===o?s=(r-n)/i:r===o?s=2+(n-e)/i:n===o&&(s=4+(e-r)/i),s=Math.min(60*s,360),s<0&&(s+=360);const u=(a+o)/2;return c=o===a?0:u<=.5?i/(o+a):i/(2-o-a),[s,100*c,100*u]},o.rgb.hsv=function(t){let e,r,n,a,o;const i=t[0]/255,s=t[1]/255,c=t[2]/255,u=Math.max(i,s,c),l=u-Math.min(i,s,c),p=function(t){return(u-t)/6/l+.5};return 0===l?(a=0,o=0):(o=l/u,e=p(i),r=p(s),n=p(c),i===u?a=n-r:s===u?a=1/3+e-n:c===u&&(a=2/3+r-e),a<0?a+=1:a>1&&(a-=1)),[360*a,100*o,100*u]},o.rgb.hwb=function(t){const e=t[0],r=t[1];let n=t[2];const a=o.rgb.hsl(t)[0],i=1/255*Math.min(e,Math.min(r,n));return n=1-1/255*Math.max(e,Math.max(r,n)),[a,100*i,100*n]},o.rgb.cmyk=function(t){const e=t[0]/255,r=t[1]/255,n=t[2]/255,a=Math.min(1-e,1-r,1-n);return[100*((1-e-a)/(1-a)||0),100*((1-r-a)/(1-a)||0),100*((1-n-a)/(1-a)||0),100*a]},o.rgb.keyword=function(t){const e=a[t];if(e)return e;let r,o=1/0;for(const e of Object.keys(n)){const a=n[e],c=(s=a,((i=t)[0]-s[0])**2+(i[1]-s[1])**2+(i[2]-s[2])**2);c<o&&(o=c,r=e)}var i,s;return r},o.keyword.rgb=function(t){return n[t]},o.rgb.xyz=function(t){let e=t[0]/255,r=t[1]/255,n=t[2]/255;e=e>.04045?((e+.055)/1.055)**2.4:e/12.92,r=r>.04045?((r+.055)/1.055)**2.4:r/12.92,n=n>.04045?((n+.055)/1.055)**2.4:n/12.92;return[100*(.4124*e+.3576*r+.1805*n),100*(.2126*e+.7152*r+.0722*n),100*(.0193*e+.1192*r+.9505*n)]},o.rgb.lab=function(t){const e=o.rgb.xyz(t);let r=e[0],n=e[1],a=e[2];r/=95.047,n/=100,a/=108.883,r=r>.008856?r**(1/3):7.787*r+16/116,n=n>.008856?n**(1/3):7.787*n+16/116,a=a>.008856?a**(1/3):7.787*a+16/116;return[116*n-16,500*(r-n),200*(n-a)]},o.hsl.rgb=function(t){const e=t[0]/360,r=t[1]/100,n=t[2]/100;let a,o,i;if(0===r)return i=255*n,[i,i,i];a=n<.5?n*(1+r):n+r-n*r;const s=2*n-a,c=[0,0,0];for(let t=0;t<3;t++)o=e+1/3*-(t-1),o<0&&o++,o>1&&o--,i=6*o<1?s+6*(a-s)*o:2*o<1?a:3*o<2?s+(a-s)*(2/3-o)*6:s,c[t]=255*i;return c},o.hsl.hsv=function(t){const e=t[0];let r=t[1]/100,n=t[2]/100,a=r;const o=Math.max(n,.01);n*=2,r*=n<=1?n:2-n,a*=o<=1?o:2-o;return[e,100*(0===n?2*a/(o+a):2*r/(n+r)),100*((n+r)/2)]},o.hsv.rgb=function(t){const e=t[0]/60,r=t[1]/100;let n=t[2]/100;const a=Math.floor(e)%6,o=e-Math.floor(e),i=255*n*(1-r),s=255*n*(1-r*o),c=255*n*(1-r*(1-o));switch(n*=255,a){case 0:return[n,c,i];case 1:return[s,n,i];case 2:return[i,n,c];case 3:return[i,s,n];case 4:return[c,i,n];case 5:return[n,i,s]}},o.hsv.hsl=function(t){const e=t[0],r=t[1]/100,n=t[2]/100,a=Math.max(n,.01);let o,i;i=(2-r)*n;const s=(2-r)*a;return o=r*a,o/=s<=1?s:2-s,o=o||0,i/=2,[e,100*o,100*i]},o.hwb.rgb=function(t){const e=t[0]/360;let r=t[1]/100,n=t[2]/100;const a=r+n;let o;a>1&&(r/=a,n/=a);const i=Math.floor(6*e),s=1-n;o=6*e-i,0!=(1&i)&&(o=1-o);const c=r+o*(s-r);let u,l,p;switch(i){default:case 6:case 0:u=s,l=c,p=r;break;case 1:u=c,l=s,p=r;break;case 2:u=r,l=s,p=c;break;case 3:u=r,l=c,p=s;break;case 4:u=c,l=r,p=s;break;case 5:u=s,l=r,p=c}return[255*u,255*l,255*p]},o.cmyk.rgb=function(t){const e=t[0]/100,r=t[1]/100,n=t[2]/100,a=t[3]/100;return[255*(1-Math.min(1,e*(1-a)+a)),255*(1-Math.min(1,r*(1-a)+a)),255*(1-Math.min(1,n*(1-a)+a))]},o.xyz.rgb=function(t){const e=t[0]/100,r=t[1]/100,n=t[2]/100;let a,o,i;return a=3.2406*e+-1.5372*r+-.4986*n,o=-.9689*e+1.8758*r+.0415*n,i=.0557*e+-.204*r+1.057*n,a=a>.0031308?1.055*a**(1/2.4)-.055:12.92*a,o=o>.0031308?1.055*o**(1/2.4)-.055:12.92*o,i=i>.0031308?1.055*i**(1/2.4)-.055:12.92*i,a=Math.min(Math.max(0,a),1),o=Math.min(Math.max(0,o),1),i=Math.min(Math.max(0,i),1),[255*a,255*o,255*i]},o.xyz.lab=function(t){let e=t[0],r=t[1],n=t[2];e/=95.047,r/=100,n/=108.883,e=e>.008856?e**(1/3):7.787*e+16/116,r=r>.008856?r**(1/3):7.787*r+16/116,n=n>.008856?n**(1/3):7.787*n+16/116;return[116*r-16,500*(e-r),200*(r-n)]},o.lab.xyz=function(t){let e,r,n;r=(t[0]+16)/116,e=t[1]/500+r,n=r-t[2]/200;const a=r**3,o=e**3,i=n**3;return r=a>.008856?a:(r-16/116)/7.787,e=o>.008856?o:(e-16/116)/7.787,n=i>.008856?i:(n-16/116)/7.787,e*=95.047,r*=100,n*=108.883,[e,r,n]},o.lab.lch=function(t){const e=t[0],r=t[1],n=t[2];let a;a=360*Math.atan2(n,r)/2/Math.PI,a<0&&(a+=360);return[e,Math.sqrt(r*r+n*n),a]},o.lch.lab=function(t){const e=t[0],r=t[1],n=t[2]/360*2*Math.PI;return[e,r*Math.cos(n),r*Math.sin(n)]},o.rgb.ansi16=function(t,e=null){const[r,n,a]=t;let i=null===e?o.rgb.hsv(t)[2]:e;if(i=Math.round(i/50),0===i)return 30;let s=30+(Math.round(a/255)<<2|Math.round(n/255)<<1|Math.round(r/255));return 2===i&&(s+=60),s},o.hsv.ansi16=function(t){return o.rgb.ansi16(o.hsv.rgb(t),t[2])},o.rgb.ansi256=function(t){const e=t[0],r=t[1],n=t[2];if(e===r&&r===n)return e<8?16:e>248?231:Math.round((e-8)/247*24)+232;return 16+36*Math.round(e/255*5)+6*Math.round(r/255*5)+Math.round(n/255*5)},o.ansi16.rgb=function(t){let e=t%10;if(0===e||7===e)return t>50&&(e+=3.5),e=e/10.5*255,[e,e,e];const r=.5*(1+~~(t>50));return[(1&e)*r*255,(e>>1&1)*r*255,(e>>2&1)*r*255]},o.ansi256.rgb=function(t){if(t>=232){const e=10*(t-232)+8;return[e,e,e]}let e;t-=16;return[Math.floor(t/36)/5*255,Math.floor((e=t%36)/6)/5*255,e%6/5*255]},o.rgb.hex=function(t){const e=(((255&Math.round(t[0]))<<16)+((255&Math.round(t[1]))<<8)+(255&Math.round(t[2]))).toString(16).toUpperCase();return"000000".substring(e.length)+e},o.hex.rgb=function(t){const e=t.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);if(!e)return[0,0,0];let r=e[0];3===e[0].length&&(r=r.split("").map((t=>t+t)).join(""));const n=parseInt(r,16);return[n>>16&255,n>>8&255,255&n]},o.rgb.hcg=function(t){const e=t[0]/255,r=t[1]/255,n=t[2]/255,a=Math.max(Math.max(e,r),n),o=Math.min(Math.min(e,r),n),i=a-o;let s,c;return s=i<1?o/(1-i):0,c=i<=0?0:a===e?(r-n)/i%6:a===r?2+(n-e)/i:4+(e-r)/i,c/=6,c%=1,[360*c,100*i,100*s]},o.hsl.hcg=function(t){const e=t[1]/100,r=t[2]/100,n=r<.5?2*e*r:2*e*(1-r);let a=0;return n<1&&(a=(r-.5*n)/(1-n)),[t[0],100*n,100*a]},o.hsv.hcg=function(t){const e=t[1]/100,r=t[2]/100,n=e*r;let a=0;return n<1&&(a=(r-n)/(1-n)),[t[0],100*n,100*a]},o.hcg.rgb=function(t){const e=t[0]/360,r=t[1]/100,n=t[2]/100;if(0===r)return[255*n,255*n,255*n];const a=[0,0,0],o=e%1*6,i=o%1,s=1-i;let c=0;switch(Math.floor(o)){case 0:a[0]=1,a[1]=i,a[2]=0;break;case 1:a[0]=s,a[1]=1,a[2]=0;break;case 2:a[0]=0,a[1]=1,a[2]=i;break;case 3:a[0]=0,a[1]=s,a[2]=1;break;case 4:a[0]=i,a[1]=0,a[2]=1;break;default:a[0]=1,a[1]=0,a[2]=s}return c=(1-r)*n,[255*(r*a[0]+c),255*(r*a[1]+c),255*(r*a[2]+c)]},o.hcg.hsv=function(t){const e=t[1]/100,r=e+t[2]/100*(1-e);let n=0;return r>0&&(n=e/r),[t[0],100*n,100*r]},o.hcg.hsl=function(t){const e=t[1]/100,r=t[2]/100*(1-e)+.5*e;let n=0;return r>0&&r<.5?n=e/(2*r):r>=.5&&r<1&&(n=e/(2*(1-r))),[t[0],100*n,100*r]},o.hcg.hwb=function(t){const e=t[1]/100,r=e+t[2]/100*(1-e);return[t[0],100*(r-e),100*(1-r)]},o.hwb.hcg=function(t){const e=t[1]/100,r=1-t[2]/100,n=r-e;let a=0;return n<1&&(a=(r-n)/(1-n)),[t[0],100*n,100*a]},o.apple.rgb=function(t){return[t[0]/65535*255,t[1]/65535*255,t[2]/65535*255]},o.rgb.apple=function(t){return[t[0]/255*65535,t[1]/255*65535,t[2]/255*65535]},o.gray.rgb=function(t){return[t[0]/100*255,t[0]/100*255,t[0]/100*255]},o.gray.hsl=function(t){return[0,0,t[0]]},o.gray.hsv=o.gray.hsl,o.gray.hwb=function(t){return[0,100,t[0]]},o.gray.cmyk=function(t){return[0,0,0,t[0]]},o.gray.lab=function(t){return[t[0],0,0]},o.gray.hex=function(t){const e=255&Math.round(t[0]/100*255),r=((e<<16)+(e<<8)+e).toString(16).toUpperCase();return"000000".substring(r.length)+r},o.rgb.gray=function(t){return[(t[0]+t[1]+t[2])/3/255*100]}},7747:(t,e,r)=>{const n=r(5043),a=r(8074),o={};Object.keys(n).forEach((t=>{o[t]={},Object.defineProperty(o[t],"channels",{value:n[t].channels}),Object.defineProperty(o[t],"labels",{value:n[t].labels});const e=a(t);Object.keys(e).forEach((r=>{const n=e[r];o[t][r]=function(t){const e=function(...e){const r=e[0];if(null==r)return r;r.length>1&&(e=r);const n=t(e);if("object"==typeof n)for(let t=n.length,e=0;e<t;e++)n[e]=Math.round(n[e]);return n};return"conversion"in t&&(e.conversion=t.conversion),e}(n),o[t][r].raw=function(t){const e=function(...e){const r=e[0];return null==r?r:(r.length>1&&(e=r),t(e))};return"conversion"in t&&(e.conversion=t.conversion),e}(n)}))})),t.exports=o},8074:(t,e,r)=>{const n=r(5043);function a(t){const e=function(){const t={},e=Object.keys(n);for(let r=e.length,n=0;n<r;n++)t[e[n]]={distance:-1,parent:null};return t}(),r=[t];for(e[t].distance=0;r.length;){const t=r.pop(),a=Object.keys(n[t]);for(let n=a.length,o=0;o<n;o++){const n=a[o],i=e[n];-1===i.distance&&(i.distance=e[t].distance+1,i.parent=t,r.unshift(n))}}return e}function o(t,e){return function(r){return e(t(r))}}function i(t,e){const r=[e[t].parent,t];let a=n[e[t].parent][t],i=e[t].parent;for(;e[i].parent;)r.unshift(e[i].parent),a=o(n[e[i].parent][i],a),i=e[i].parent;return a.conversion=r,a}t.exports=function(t){const e=a(t),r={},n=Object.keys(e);for(let t=n.length,a=0;a<t;a++){const t=n[a];null!==e[t].parent&&(r[t]=i(t,e))}return r}},1086:t=>{"use strict";t.exports={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]}},5089:(t,e,r)=>{var n=r(930),a=r(9268),o=TypeError;t.exports=function(t){if(n(t))return t;throw o(a(t)+" is not a function")}},1449:(t,e,r)=>{var n=r(1956),a=r(9268),o=TypeError;t.exports=function(t){if(n(t))return t;throw o(a(t)+" is not a constructor")}},1378:(t,e,r)=>{var n=r(930),a=String,o=TypeError;t.exports=function(t){if("object"==typeof t||n(t))return t;throw o("Can't set "+a(t)+" as a prototype")}},8669:(t,e,r)=>{var n=r(211),a=r(4710),o=r(7826).f,i=n("unscopables"),s=Array.prototype;null==s[i]&&o(s,i,{configurable:!0,value:a(null)}),t.exports=function(t){s[i][t]=!0}},9966:(t,e,r)=>{"use strict";var n=r(3448).charAt;t.exports=function(t,e,r){return e+(r?n(t,e).length:1)}},6112:(t,e,r)=>{var n=r(8759),a=String,o=TypeError;t.exports=function(t){if(n(t))return t;throw o(a(t)+" is not an object")}},1005:(t,e,r)=>{var n=r(3677);t.exports=n((function(){if("function"==typeof ArrayBuffer){var t=new ArrayBuffer(8);Object.isExtensible(t)&&Object.defineProperty(t,"a",{value:8})}}))},1984:(t,e,r)=>{"use strict";var n=r(8062).forEach,a=r(2802)("forEach");t.exports=a?[].forEach:function(t){return n(this,t,arguments.length>1?arguments[1]:void 0)}},1842:(t,e,r)=>{"use strict";var n=r(8516),a=r(9413),o=r(3060),i=r(7850),s=r(2814),c=r(1956),u=r(2871),l=r(9720),p=r(3546),h=r(1667),d=Array;t.exports=function(t){var e=o(t),r=c(this),f=arguments.length,v=f>1?arguments[1]:void 0,m=void 0!==v;m&&(v=n(v,f>2?arguments[2]:void 0));var b,g,y,k,w,C,S=h(e),x=0;if(!S||this===d&&s(S))for(b=u(e),g=r?new this(b):d(b);b>x;x++)C=m?v(e[x],x):e[x],l(g,x,C);else for(w=(k=p(e,S)).next,g=r?new this:[];!(y=a(w,k)).done;x++)C=m?i(k,v,[y.value,x],!0):y.value,l(g,x,C);return g.length=x,g}},6198:(t,e,r)=>{var n=r(4088),a=r(7740),o=r(2871),i=function(t){return function(e,r,i){var s,c=n(e),u=o(c),l=a(i,u);if(t&&r!=r){for(;u>l;)if((s=c[l++])!=s)return!0}else for(;u>l;l++)if((t||l in c)&&c[l]===r)return t||l||0;return!t&&-1}};t.exports={includes:i(!0),indexOf:i(!1)}},8062:(t,e,r)=>{var n=r(8516),a=r(8240),o=r(5974),i=r(3060),s=r(2871),c=r(5574),u=a([].push),l=function(t){var e=1==t,r=2==t,a=3==t,l=4==t,p=6==t,h=7==t,d=5==t||p;return function(f,v,m,b){for(var g,y,k=i(f),w=o(k),C=n(v,m),S=s(w),x=0,O=b||c,E=e?O(f,S):r||h?O(f,0):void 0;S>x;x++)if((d||x in w)&&(y=C(g=w[x],x,k),t))if(e)E[x]=y;else if(y)switch(t){case 3:return!0;case 5:return g;case 6:return x;case 2:u(E,g)}else switch(t){case 4:return!1;case 7:u(E,g)}return p?-1:a||l?l:E}};t.exports={forEach:l(0),map:l(1),filter:l(2),some:l(3),every:l(4),find:l(5),findIndex:l(6),filterReject:l(7)}},9955:(t,e,r)=>{var n=r(3677),a=r(211),o=r(1448),i=a("species");t.exports=function(t){return o>=51||!n((function(){var e=[];return(e.constructor={})[i]=function(){return{foo:1}},1!==e[t](Boolean).foo}))}},2802:(t,e,r)=>{"use strict";var n=r(3677);t.exports=function(t,e){var r=[][t];return!!r&&n((function(){r.call(null,e||function(){return 1},1)}))}},3329:(t,e,r)=>{var n=r(7740),a=r(2871),o=r(9720),i=Array,s=Math.max;t.exports=function(t,e,r){for(var c=a(t),u=n(e,c),l=n(void 0===r?c:r,c),p=i(s(l-u,0)),h=0;u<l;u++,h++)o(p,h,t[u]);return p.length=h,p}},745:(t,e,r)=>{var n=r(8240);t.exports=n([].slice)},8789:(t,e,r)=>{var n=r(6526),a=r(1956),o=r(8759),i=r(211)("species"),s=Array;t.exports=function(t){var e;return n(t)&&(e=t.constructor,(a(e)&&(e===s||n(e.prototype))||o(e)&&null===(e=e[i]))&&(e=void 0)),void 0===e?s:e}},5574:(t,e,r)=>{var n=r(8789);t.exports=function(t,e){return new(n(t))(0===e?0:e)}},7850:(t,e,r)=>{var n=r(6112),a=r(6737);t.exports=function(t,e,r,o){try{return o?e(n(r)[0],r[1]):e(r)}catch(e){a(t,"throw",e)}}},8939:(t,e,r)=>{var n=r(211)("iterator"),a=!1;try{var o=0,i={next:function(){return{done:!!o++}},return:function(){a=!0}};i[n]=function(){return this},Array.from(i,(function(){throw 2}))}catch(t){}t.exports=function(t,e){if(!e&&!a)return!1;var r=!1;try{var o={};o[n]=function(){return{next:function(){return{done:r=!0}}}},t(o)}catch(t){}return r}},2306:(t,e,r)=>{var n=r(8240),a=n({}.toString),o=n("".slice);t.exports=function(t){return o(a(t),8,-1)}},375:(t,e,r)=>{var n=r(2371),a=r(930),o=r(2306),i=r(211)("toStringTag"),s=Object,c="Arguments"==o(function(){return arguments}());t.exports=n?o:function(t){var e,r,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(r=function(t,e){try{return t[e]}catch(t){}}(e=s(t),i))?r:c?o(e):"Object"==(n=o(e))&&a(e.callee)?"Arguments":n}},8474:(t,e,r)=>{var n=r(9606),a=r(6095),o=r(4399),i=r(7826);t.exports=function(t,e,r){for(var s=a(e),c=i.f,u=o.f,l=0;l<s.length;l++){var p=s[l];n(t,p)||r&&n(r,p)||c(t,p,u(e,p))}}},7209:(t,e,r)=>{var n=r(3677);t.exports=!n((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype}))},471:(t,e,r)=>{"use strict";var n=r(3083).IteratorPrototype,a=r(4710),o=r(5736),i=r(914),s=r(7719),c=function(){return this};t.exports=function(t,e,r,u){var l=e+" Iterator";return t.prototype=a(n,{next:o(+!u,r)}),i(t,l,!1,!0),s[l]=c,t}},2585:(t,e,r)=>{var n=r(5283),a=r(7826),o=r(5736);t.exports=n?function(t,e,r){return a.f(t,e,o(1,r))}:function(t,e,r){return t[e]=r,t}},5736:t=>{t.exports=function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}},9720:(t,e,r)=>{"use strict";var n=r(2258),a=r(7826),o=r(5736);t.exports=function(t,e,r){var i=n(e);i in t?a.f(t,i,o(0,r)):t[i]=r}},1343:(t,e,r)=>{var n=r(930),a=r(7826),o=r(3712),i=r(9444);t.exports=function(t,e,r,s){s||(s={});var c=s.enumerable,u=void 0!==s.name?s.name:e;if(n(r)&&o(r,u,s),s.global)c?t[e]=r:i(e,r);else{try{s.unsafe?t[e]&&(c=!0):delete t[e]}catch(t){}c?t[e]=r:a.f(t,e,{value:r,enumerable:!1,configurable:!s.nonConfigurable,writable:!s.nonWritable})}return t}},9444:(t,e,r)=>{var n=r(2086),a=Object.defineProperty;t.exports=function(t,e){try{a(n,t,{value:e,configurable:!0,writable:!0})}catch(r){n[t]=e}return e}},8432:(t,e,r)=>{"use strict";var n=r(1695),a=r(9413),o=r(3296),i=r(4398),s=r(930),c=r(471),u=r(2130),l=r(7530),p=r(914),h=r(2585),d=r(1343),f=r(211),v=r(7719),m=r(3083),b=i.PROPER,g=i.CONFIGURABLE,y=m.IteratorPrototype,k=m.BUGGY_SAFARI_ITERATORS,w=f("iterator"),C="keys",S="values",x="entries",O=function(){return this};t.exports=function(t,e,r,i,f,m,E){c(r,e,i);var L,P,A,T=function(t){if(t===f&&F)return F;if(!k&&t in M)return M[t];switch(t){case C:case S:case x:return function(){return new r(this,t)}}return function(){return new r(this)}},j=e+" Iterator",I=!1,M=t.prototype,B=M[w]||M["@@iterator"]||f&&M[f],F=!k&&B||T(f),R="Array"==e&&M.entries||B;if(R&&(L=u(R.call(new t)))!==Object.prototype&&L.next&&(o||u(L)===y||(l?l(L,y):s(L[w])||d(L,w,O)),p(L,j,!0,!0),o&&(v[j]=O)),b&&f==S&&B&&B.name!==S&&(!o&&g?h(M,"name",S):(I=!0,F=function(){return a(B,this)})),f)if(P={values:T(S),keys:m?F:T(C),entries:T(x)},E)for(A in P)(k||I||!(A in M))&&d(M,A,P[A]);else n({target:e,proto:!0,forced:k||I},P);return o&&!E||M[w]===F||d(M,w,F,{name:f}),v[e]=F,P}},4145:(t,e,r)=>{var n=r(9775),a=r(9606),o=r(9251),i=r(7826).f;t.exports=function(t){var e=n.Symbol||(n.Symbol={});a(e,t)||i(e,t,{value:o.f(t)})}},5283:(t,e,r)=>{var n=r(3677);t.exports=!n((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]}))},821:(t,e,r)=>{var n=r(2086),a=r(8759),o=n.document,i=a(o)&&a(o.createElement);t.exports=function(t){return i?o.createElement(t):{}}},7620:t=>{var e=TypeError;t.exports=function(t){if(t>9007199254740991)throw e("Maximum allowed index exceeded");return t}},933:t=>{t.exports={CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}},3526:(t,e,r)=>{var n=r(821)("span").classList,a=n&&n.constructor&&n.constructor.prototype;t.exports=a===Object.prototype?void 0:a},4999:(t,e,r)=>{var n=r(563);t.exports=n("navigator","userAgent")||""},1448:(t,e,r)=>{var n,a,o=r(2086),i=r(4999),s=o.process,c=o.Deno,u=s&&s.versions||c&&c.version,l=u&&u.v8;l&&(a=(n=l.split("."))[0]>0&&n[0]<4?1:+(n[0]+n[1])),!a&&i&&(!(n=i.match(/Edge\/(\d+)/))||n[1]>=74)&&(n=i.match(/Chrome\/(\d+)/))&&(a=+n[1]),t.exports=a},8684:t=>{t.exports=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"]},1695:(t,e,r)=>{var n=r(2086),a=r(4399).f,o=r(2585),i=r(1343),s=r(9444),c=r(8474),u=r(7189);t.exports=function(t,e){var r,l,p,h,d,f=t.target,v=t.global,m=t.stat;if(r=v?n:m?n[f]||s(f,{}):(n[f]||{}).prototype)for(l in e){if(h=e[l],p=t.dontCallGetSet?(d=a(r,l))&&d.value:r[l],!u(v?l:f+(m?".":"#")+l,t.forced)&&void 0!==p){if(typeof h==typeof p)continue;c(h,p)}(t.sham||p&&p.sham)&&o(h,"sham",!0),i(r,l,h,t)}}},3677:t=>{t.exports=function(t){try{return!!t()}catch(t){return!0}}},2331:(t,e,r)=>{"use strict";r(2077);var n=r(8240),a=r(1343),o=r(4861),i=r(3677),s=r(211),c=r(2585),u=s("species"),l=RegExp.prototype;t.exports=function(t,e,r,p){var h=s(t),d=!i((function(){var e={};return e[h]=function(){return 7},7!=""[t](e)})),f=d&&!i((function(){var e=!1,r=/a/;return"split"===t&&((r={}).constructor={},r.constructor[u]=function(){return r},r.flags="",r[h]=/./[h]),r.exec=function(){return e=!0,null},r[h](""),!e}));if(!d||!f||r){var v=n(/./[h]),m=e(h,""[t],(function(t,e,r,a,i){var s=n(t),c=e.exec;return c===o||c===l.exec?d&&!i?{done:!0,value:v(e,r,a)}:{done:!0,value:s(r,e,a)}:{done:!1}}));a(String.prototype,t,m[0]),a(l,h,m[1])}p&&c(l[h],"sham",!0)}},6910:(t,e,r)=>{var n=r(3677);t.exports=!n((function(){return Object.isExtensible(Object.preventExtensions({}))}))},7258:(t,e,r)=>{var n=r(6059),a=Function.prototype,o=a.apply,i=a.call;t.exports="object"==typeof Reflect&&Reflect.apply||(n?i.bind(o):function(){return i.apply(o,arguments)})},8516:(t,e,r)=>{var n=r(8240),a=r(5089),o=r(6059),i=n(n.bind);t.exports=function(t,e){return a(t),void 0===e?t:o?i(t,e):function(){return t.apply(e,arguments)}}},6059:(t,e,r)=>{var n=r(3677);t.exports=!n((function(){var t=function(){}.bind();return"function"!=typeof t||t.hasOwnProperty("prototype")}))},2395:(t,e,r)=>{"use strict";var n=r(8240),a=r(5089),o=r(8759),i=r(9606),s=r(745),c=r(6059),u=Function,l=n([].concat),p=n([].join),h={};t.exports=c?u.bind:function(t){var e=a(this),r=e.prototype,n=s(arguments,1),c=function(){var r=l(n,s(arguments));return this instanceof c?function(t,e,r){if(!i(h,e)){for(var n=[],a=0;a<e;a++)n[a]="a["+a+"]";h[e]=u("C,a","return new C("+p(n,",")+")")}return h[e](t,r)}(e,r.length,r):e.apply(t,r)};return o(r)&&(c.prototype=r),c}},9413:(t,e,r)=>{var n=r(6059),a=Function.prototype.call;t.exports=n?a.bind(a):function(){return a.apply(a,arguments)}},4398:(t,e,r)=>{var n=r(5283),a=r(9606),o=Function.prototype,i=n&&Object.getOwnPropertyDescriptor,s=a(o,"name"),c=s&&"something"===function(){}.name,u=s&&(!n||n&&i(o,"name").configurable);t.exports={EXISTS:s,PROPER:c,CONFIGURABLE:u}},8240:(t,e,r)=>{var n=r(6059),a=Function.prototype,o=a.bind,i=a.call,s=n&&o.bind(i,i);t.exports=n?function(t){return t&&s(t)}:function(t){return t&&function(){return i.apply(t,arguments)}}},563:(t,e,r)=>{var n=r(2086),a=r(930);t.exports=function(t,e){return arguments.length<2?(r=n[t],a(r)?r:void 0):n[t]&&n[t][e];var r}},1667:(t,e,r)=>{var n=r(375),a=r(2964),o=r(7719),i=r(211)("iterator");t.exports=function(t){if(null!=t)return a(t,i)||a(t,"@@iterator")||o[n(t)]}},3546:(t,e,r)=>{var n=r(9413),a=r(5089),o=r(6112),i=r(9268),s=r(1667),c=TypeError;t.exports=function(t,e){var r=arguments.length<2?s(t):e;if(a(r))return o(n(r,t));throw c(i(t)+" is not iterable")}},2964:(t,e,r)=>{var n=r(5089);t.exports=function(t,e){var r=t[e];return null==r?void 0:n(r)}},8509:(t,e,r)=>{var n=r(8240),a=r(3060),o=Math.floor,i=n("".charAt),s=n("".replace),c=n("".slice),u=/\$([$&'`]|\d{1,2}|<[^>]*>)/g,l=/\$([$&'`]|\d{1,2})/g;t.exports=function(t,e,r,n,p,h){var d=r+t.length,f=n.length,v=l;return void 0!==p&&(p=a(p),v=u),s(h,v,(function(a,s){var u;switch(i(s,0)){case"$":return"$";case"&":return t;case"`":return c(e,0,r);case"'":return c(e,d);case"<":u=p[c(s,1,-1)];break;default:var l=+s;if(0===l)return a;if(l>f){var h=o(l/10);return 0===h?a:h<=f?void 0===n[h-1]?i(s,1):n[h-1]+i(s,1):a}u=n[l-1]}return void 0===u?"":u}))}},2086:(t,e,r)=>{var n=function(t){return t&&t.Math==Math&&t};t.exports=n("object"==typeof globalThis&&globalThis)||n("object"==typeof window&&window)||n("object"==typeof self&&self)||n("object"==typeof r.g&&r.g)||function(){return this}()||Function("return this")()},9606:(t,e,r)=>{var n=r(8240),a=r(3060),o=n({}.hasOwnProperty);t.exports=Object.hasOwn||function(t,e){return o(a(t),e)}},7153:t=>{t.exports={}},5963:(t,e,r)=>{var n=r(563);t.exports=n("document","documentElement")},6761:(t,e,r)=>{var n=r(5283),a=r(3677),o=r(821);t.exports=!n&&!a((function(){return 7!=Object.defineProperty(o("div"),"a",{get:function(){return 7}}).a}))},5974:(t,e,r)=>{var n=r(8240),a=r(3677),o=r(2306),i=Object,s=n("".split);t.exports=a((function(){return!i("z").propertyIsEnumerable(0)}))?function(t){return"String"==o(t)?s(t,""):i(t)}:i},9277:(t,e,r)=>{var n=r(8240),a=r(930),o=r(4489),i=n(Function.toString);a(o.inspectSource)||(o.inspectSource=function(t){return i(t)}),t.exports=o.inspectSource},2423:(t,e,r)=>{var n=r(1695),a=r(8240),o=r(7153),i=r(8759),s=r(9606),c=r(7826).f,u=r(62),l=r(3226),p=r(3813),h=r(5422),d=r(6910),f=!1,v=h("meta"),m=0,b=function(t){c(t,v,{value:{objectID:"O"+m++,weakData:{}}})},g=t.exports={enable:function(){g.enable=function(){},f=!0;var t=u.f,e=a([].splice),r={};r[v]=1,t(r).length&&(u.f=function(r){for(var n=t(r),a=0,o=n.length;a<o;a++)if(n[a]===v){e(n,a,1);break}return n},n({target:"Object",stat:!0,forced:!0},{getOwnPropertyNames:l.f}))},fastKey:function(t,e){if(!i(t))return"symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!s(t,v)){if(!p(t))return"F";if(!e)return"E";b(t)}return t[v].objectID},getWeakData:function(t,e){if(!s(t,v)){if(!p(t))return!0;if(!e)return!1;b(t)}return t[v].weakData},onFreeze:function(t){return d&&f&&p(t)&&!s(t,v)&&b(t),t}};o[v]=!0},3278:(t,e,r)=>{var n,a,o,i=r(9316),s=r(2086),c=r(8240),u=r(8759),l=r(2585),p=r(9606),h=r(4489),d=r(8944),f=r(7153),v="Object already initialized",m=s.TypeError,b=s.WeakMap;if(i||h.state){var g=h.state||(h.state=new b),y=c(g.get),k=c(g.has),w=c(g.set);n=function(t,e){if(k(g,t))throw new m(v);return e.facade=t,w(g,t,e),e},a=function(t){return y(g,t)||{}},o=function(t){return k(g,t)}}else{var C=d("state");f[C]=!0,n=function(t,e){if(p(t,C))throw new m(v);return e.facade=t,l(t,C,e),e},a=function(t){return p(t,C)?t[C]:{}},o=function(t){return p(t,C)}}t.exports={set:n,get:a,has:o,enforce:function(t){return o(t)?a(t):n(t,{})},getterFor:function(t){return function(e){var r;if(!u(e)||(r=a(e)).type!==t)throw m("Incompatible receiver, "+t+" required");return r}}}},2814:(t,e,r)=>{var n=r(211),a=r(7719),o=n("iterator"),i=Array.prototype;t.exports=function(t){return void 0!==t&&(a.Array===t||i[o]===t)}},6526:(t,e,r)=>{var n=r(2306);t.exports=Array.isArray||function(t){return"Array"==n(t)}},930:t=>{t.exports=function(t){return"function"==typeof t}},1956:(t,e,r)=>{var n=r(8240),a=r(3677),o=r(930),i=r(375),s=r(563),c=r(9277),u=function(){},l=[],p=s("Reflect","construct"),h=/^\s*(?:class|function)\b/,d=n(h.exec),f=!h.exec(u),v=function(t){if(!o(t))return!1;try{return p(u,l,t),!0}catch(t){return!1}},m=function(t){if(!o(t))return!1;switch(i(t)){case"AsyncFunction":case"GeneratorFunction":case"AsyncGeneratorFunction":return!1}try{return f||!!d(h,c(t))}catch(t){return!0}};m.sham=!0,t.exports=!p||a((function(){var t;return v(v.call)||!v(Object)||!v((function(){t=!0}))||t}))?m:v},7189:(t,e,r)=>{var n=r(3677),a=r(930),o=/#|\.prototype\./,i=function(t,e){var r=c[s(t)];return r==l||r!=u&&(a(e)?n(e):!!e)},s=i.normalize=function(t){return String(t).replace(o,".").toLowerCase()},c=i.data={},u=i.NATIVE="N",l=i.POLYFILL="P";t.exports=i},8759:(t,e,r)=>{var n=r(930);t.exports=function(t){return"object"==typeof t?null!==t:n(t)}},3296:t=>{t.exports=!1},7994:(t,e,r)=>{var n=r(8759),a=r(2306),o=r(211)("match");t.exports=function(t){var e;return n(t)&&(void 0!==(e=t[o])?!!e:"RegExp"==a(t))}},2071:(t,e,r)=>{var n=r(563),a=r(930),o=r(5516),i=r(1876),s=Object;t.exports=i?function(t){return"symbol"==typeof t}:function(t){var e=n("Symbol");return a(e)&&o(e.prototype,s(t))}},6737:(t,e,r)=>{var n=r(9413),a=r(6112),o=r(2964);t.exports=function(t,e,r){var i,s;a(t);try{if(!(i=o(t,"return"))){if("throw"===e)throw r;return r}i=n(i,t)}catch(t){s=!0,i=t}if("throw"===e)throw r;if(s)throw i;return a(i),r}},3083:(t,e,r)=>{"use strict";var n,a,o,i=r(3677),s=r(930),c=r(4710),u=r(2130),l=r(1343),p=r(211),h=r(3296),d=p("iterator"),f=!1;[].keys&&("next"in(o=[].keys())?(a=u(u(o)))!==Object.prototype&&(n=a):f=!0),null==n||i((function(){var t={};return n[d].call(t)!==t}))?n={}:h&&(n=c(n)),s(n[d])||l(n,d,(function(){return this})),t.exports={IteratorPrototype:n,BUGGY_SAFARI_ITERATORS:f}},7719:t=>{t.exports={}},2871:(t,e,r)=>{var n=r(4005);t.exports=function(t){return n(t.length)}},3712:(t,e,r)=>{var n=r(3677),a=r(930),o=r(9606),i=r(5283),s=r(4398).CONFIGURABLE,c=r(9277),u=r(3278),l=u.enforce,p=u.get,h=Object.defineProperty,d=i&&!n((function(){return 8!==h((function(){}),"length",{value:8}).length})),f=String(String).split("String"),v=t.exports=function(t,e,r){"Symbol("===String(e).slice(0,7)&&(e="["+String(e).replace(/^Symbol\(([^)]*)\)/,"$1")+"]"),r&&r.getter&&(e="get "+e),r&&r.setter&&(e="set "+e),(!o(t,"name")||s&&t.name!==e)&&(i?h(t,"name",{value:e,configurable:!0}):t.name=e),d&&r&&o(r,"arity")&&t.length!==r.arity&&h(t,"length",{value:r.arity});try{r&&o(r,"constructor")&&r.constructor?i&&h(t,"prototype",{writable:!1}):t.prototype&&(t.prototype=void 0)}catch(t){}var n=l(t);return o(n,"source")||(n.source=f.join("string"==typeof e?e:"")),t};Function.prototype.toString=v((function(){return a(this)&&p(this).source||c(this)}),"toString")},5681:t=>{var e=Math.ceil,r=Math.floor;t.exports=Math.trunc||function(t){var n=+t;return(n>0?r:e)(n)}},3441:(t,e,r)=>{var n=r(3193);t.exports=n&&!!Symbol.for&&!!Symbol.keyFor},3193:(t,e,r)=>{var n=r(1448),a=r(3677);t.exports=!!Object.getOwnPropertySymbols&&!a((function(){var t=Symbol();return!String(t)||!(Object(t)instanceof Symbol)||!Symbol.sham&&n&&n<41}))},9316:(t,e,r)=>{var n=r(2086),a=r(930),o=r(9277),i=n.WeakMap;t.exports=a(i)&&/native code/.test(o(i))},8675:(t,e,r)=>{"use strict";var n=r(5283),a=r(8240),o=r(9413),i=r(3677),s=r(8779),c=r(6952),u=r(7446),l=r(3060),p=r(5974),h=Object.assign,d=Object.defineProperty,f=a([].concat);t.exports=!h||i((function(){if(n&&1!==h({b:1},h(d({},"a",{enumerable:!0,get:function(){d(this,"b",{value:3,enumerable:!1})}}),{b:2})).b)return!0;var t={},e={},r=Symbol(),a="abcdefghijklmnopqrst";return t[r]=7,a.split("").forEach((function(t){e[t]=t})),7!=h({},t)[r]||s(h({},e)).join("")!=a}))?function(t,e){for(var r=l(t),a=arguments.length,i=1,h=c.f,d=u.f;a>i;)for(var v,m=p(arguments[i++]),b=h?f(s(m),h(m)):s(m),g=b.length,y=0;g>y;)v=b[y++],n&&!o(d,m,v)||(r[v]=m[v]);return r}:h},4710:(t,e,r)=>{var n,a=r(6112),o=r(7711),i=r(8684),s=r(7153),c=r(5963),u=r(821),l=r(8944),p="prototype",h="script",d=l("IE_PROTO"),f=function(){},v=function(t){return"<"+h+">"+t+"</"+h+">"},m=function(t){t.write(v("")),t.close();var e=t.parentWindow.Object;return t=null,e},b=function(){try{n=new ActiveXObject("htmlfile")}catch(t){}var t,e,r;b="undefined"!=typeof document?document.domain&&n?m(n):(e=u("iframe"),r="java"+h+":",e.style.display="none",c.appendChild(e),e.src=String(r),(t=e.contentWindow.document).open(),t.write(v("document.F=Object")),t.close(),t.F):m(n);for(var a=i.length;a--;)delete b[p][i[a]];return b()};s[d]=!0,t.exports=Object.create||function(t,e){var r;return null!==t?(f[p]=a(t),r=new f,f[p]=null,r[d]=t):r=b(),void 0===e?r:o.f(r,e)}},7711:(t,e,r)=>{var n=r(5283),a=r(8202),o=r(7826),i=r(6112),s=r(4088),c=r(8779);e.f=n&&!a?Object.defineProperties:function(t,e){i(t);for(var r,n=s(e),a=c(e),u=a.length,l=0;u>l;)o.f(t,r=a[l++],n[r]);return t}},7826:(t,e,r)=>{var n=r(5283),a=r(6761),o=r(8202),i=r(6112),s=r(2258),c=TypeError,u=Object.defineProperty,l=Object.getOwnPropertyDescriptor,p="enumerable",h="configurable",d="writable";e.f=n?o?function(t,e,r){if(i(t),e=s(e),i(r),"function"==typeof t&&"prototype"===e&&"value"in r&&d in r&&!r[d]){var n=l(t,e);n&&n[d]&&(t[e]=r.value,r={configurable:h in r?r[h]:n[h],enumerable:p in r?r[p]:n[p],writable:!1})}return u(t,e,r)}:u:function(t,e,r){if(i(t),e=s(e),i(r),a)try{return u(t,e,r)}catch(t){}if("get"in r||"set"in r)throw c("Accessors not supported");return"value"in r&&(t[e]=r.value),t}},4399:(t,e,r)=>{var n=r(5283),a=r(9413),o=r(7446),i=r(5736),s=r(4088),c=r(2258),u=r(9606),l=r(6761),p=Object.getOwnPropertyDescriptor;e.f=n?p:function(t,e){if(t=s(t),e=c(e),l)try{return p(t,e)}catch(t){}if(u(t,e))return i(!a(o.f,t,e),t[e])}},3226:(t,e,r)=>{var n=r(2306),a=r(4088),o=r(62).f,i=r(3329),s="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[];t.exports.f=function(t){return s&&"Window"==n(t)?function(t){try{return o(t)}catch(t){return i(s)}}(t):o(a(t))}},62:(t,e,r)=>{var n=r(1352),a=r(8684).concat("length","prototype");e.f=Object.getOwnPropertyNames||function(t){return n(t,a)}},6952:(t,e)=>{e.f=Object.getOwnPropertySymbols},2130:(t,e,r)=>{var n=r(9606),a=r(930),o=r(3060),i=r(8944),s=r(7209),c=i("IE_PROTO"),u=Object,l=u.prototype;t.exports=s?u.getPrototypeOf:function(t){var e=o(t);if(n(e,c))return e[c];var r=e.constructor;return a(r)&&e instanceof r?r.prototype:e instanceof u?l:null}},3813:(t,e,r)=>{var n=r(3677),a=r(8759),o=r(2306),i=r(1005),s=Object.isExtensible,c=n((function(){s(1)}));t.exports=c||i?function(t){return!!a(t)&&((!i||"ArrayBuffer"!=o(t))&&(!s||s(t)))}:s},5516:(t,e,r)=>{var n=r(8240);t.exports=n({}.isPrototypeOf)},1352:(t,e,r)=>{var n=r(8240),a=r(9606),o=r(4088),i=r(6198).indexOf,s=r(7153),c=n([].push);t.exports=function(t,e){var r,n=o(t),u=0,l=[];for(r in n)!a(s,r)&&a(n,r)&&c(l,r);for(;e.length>u;)a(n,r=e[u++])&&(~i(l,r)||c(l,r));return l}},8779:(t,e,r)=>{var n=r(1352),a=r(8684);t.exports=Object.keys||function(t){return n(t,a)}},7446:(t,e)=>{"use strict";var r={}.propertyIsEnumerable,n=Object.getOwnPropertyDescriptor,a=n&&!r.call({1:2},1);e.f=a?function(t){var e=n(this,t);return!!e&&e.enumerable}:r},7530:(t,e,r)=>{var n=r(8240),a=r(6112),o=r(1378);t.exports=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,r={};try{(t=n(Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set))(r,[]),e=r instanceof Array}catch(t){}return function(r,n){return a(r),o(n),e?t(r,n):r.__proto__=n,r}}():void 0)},999:(t,e,r)=>{"use strict";var n=r(2371),a=r(375);t.exports=n?{}.toString:function(){return"[object "+a(this)+"]"}},7999:(t,e,r)=>{var n=r(9413),a=r(930),o=r(8759),i=TypeError;t.exports=function(t,e){var r,s;if("string"===e&&a(r=t.toString)&&!o(s=n(r,t)))return s;if(a(r=t.valueOf)&&!o(s=n(r,t)))return s;if("string"!==e&&a(r=t.toString)&&!o(s=n(r,t)))return s;throw i("Can't convert object to primitive value")}},6095:(t,e,r)=>{var n=r(563),a=r(8240),o=r(62),i=r(6952),s=r(6112),c=a([].concat);t.exports=n("Reflect","ownKeys")||function(t){var e=o.f(s(t)),r=i.f;return r?c(e,r(t)):e}},9775:(t,e,r)=>{var n=r(2086);t.exports=n},1189:(t,e,r)=>{var n=r(9413),a=r(6112),o=r(930),i=r(2306),s=r(4861),c=TypeError;t.exports=function(t,e){var r=t.exec;if(o(r)){var u=n(r,t,e);return null!==u&&a(u),u}if("RegExp"===i(t))return n(s,t,e);throw c("RegExp#exec called on incompatible receiver")}},4861:(t,e,r)=>{"use strict";var n,a,o=r(9413),i=r(8240),s=r(4059),c=r(4276),u=r(4930),l=r(9197),p=r(4710),h=r(3278).get,d=r(2582),f=r(2910),v=l("native-string-replace",String.prototype.replace),m=RegExp.prototype.exec,b=m,g=i("".charAt),y=i("".indexOf),k=i("".replace),w=i("".slice),C=(a=/b*/g,o(m,n=/a/,"a"),o(m,a,"a"),0!==n.lastIndex||0!==a.lastIndex),S=u.BROKEN_CARET,x=void 0!==/()??/.exec("")[1];(C||x||S||d||f)&&(b=function(t){var e,r,n,a,i,u,l,d=this,f=h(d),O=s(t),E=f.raw;if(E)return E.lastIndex=d.lastIndex,e=o(b,E,O),d.lastIndex=E.lastIndex,e;var L=f.groups,P=S&&d.sticky,A=o(c,d),T=d.source,j=0,I=O;if(P&&(A=k(A,"y",""),-1===y(A,"g")&&(A+="g"),I=w(O,d.lastIndex),d.lastIndex>0&&(!d.multiline||d.multiline&&"\n"!==g(O,d.lastIndex-1))&&(T="(?: "+T+")",I=" "+I,j++),r=new RegExp("^(?:"+T+")",A)),x&&(r=new RegExp("^"+T+"$(?!\\s)",A)),C&&(n=d.lastIndex),a=o(m,P?r:d,I),P?a?(a.input=w(a.input,j),a[0]=w(a[0],j),a.index=d.lastIndex,d.lastIndex+=a[0].length):d.lastIndex=0:C&&a&&(d.lastIndex=d.global?a.index+a[0].length:n),x&&a&&a.length>1&&o(v,a[0],r,(function(){for(i=1;i<arguments.length-2;i++)void 0===arguments[i]&&(a[i]=void 0)})),a&&L)for(a.groups=u=p(null),i=0;i<L.length;i++)u[(l=L[i])[0]]=a[l[1]];return a}),t.exports=b},4276:(t,e,r)=>{"use strict";var n=r(6112);t.exports=function(){var t=n(this),e="";return t.hasIndices&&(e+="d"),t.global&&(e+="g"),t.ignoreCase&&(e+="i"),t.multiline&&(e+="m"),t.dotAll&&(e+="s"),t.unicode&&(e+="u"),t.unicodeSets&&(e+="v"),t.sticky&&(e+="y"),e}},9028:(t,e,r)=>{var n=r(9413),a=r(9606),o=r(5516),i=r(4276),s=RegExp.prototype;t.exports=function(t){var e=t.flags;return void 0!==e||"flags"in s||a(t,"flags")||!o(s,t)?e:n(i,t)}},4930:(t,e,r)=>{var n=r(3677),a=r(2086).RegExp,o=n((function(){var t=a("a","y");return t.lastIndex=2,null!=t.exec("abcd")})),i=o||n((function(){return!a("a","y").sticky})),s=o||n((function(){var t=a("^r","gy");return t.lastIndex=2,null!=t.exec("str")}));t.exports={BROKEN_CARET:s,MISSED_STICKY:i,UNSUPPORTED_Y:o}},2582:(t,e,r)=>{var n=r(3677),a=r(2086).RegExp;t.exports=n((function(){var t=a(".","s");return!(t.dotAll&&t.exec("\n")&&"s"===t.flags)}))},2910:(t,e,r)=>{var n=r(3677),a=r(2086).RegExp;t.exports=n((function(){var t=a("(?<a>b)","g");return"b"!==t.exec("b").groups.a||"bc"!=="b".replace(t,"$<a>c")}))},9586:t=>{var e=TypeError;t.exports=function(t){if(null==t)throw e("Can't call method on "+t);return t}},914:(t,e,r)=>{var n=r(7826).f,a=r(9606),o=r(211)("toStringTag");t.exports=function(t,e,r){t&&!r&&(t=t.prototype),t&&!a(t,o)&&n(t,o,{configurable:!0,value:e})}},8944:(t,e,r)=>{var n=r(9197),a=r(5422),o=n("keys");t.exports=function(t){return o[t]||(o[t]=a(t))}},4489:(t,e,r)=>{var n=r(2086),a=r(9444),o="__core-js_shared__",i=n[o]||a(o,{});t.exports=i},9197:(t,e,r)=>{var n=r(3296),a=r(4489);(t.exports=function(t,e){return a[t]||(a[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.23.3",mode:n?"pure":"global",copyright:"© 2014-2022 Denis Pushkarev (zloirock.ru)",license:"https://github.com/zloirock/core-js/blob/v3.23.3/LICENSE",source:"https://github.com/zloirock/core-js"})},8515:(t,e,r)=>{var n=r(6112),a=r(1449),o=r(211)("species");t.exports=function(t,e){var r,i=n(t).constructor;return void 0===i||null==(r=n(i)[o])?e:a(r)}},3448:(t,e,r)=>{var n=r(8240),a=r(9502),o=r(4059),i=r(9586),s=n("".charAt),c=n("".charCodeAt),u=n("".slice),l=function(t){return function(e,r){var n,l,p=o(i(e)),h=a(r),d=p.length;return h<0||h>=d?t?"":void 0:(n=c(p,h))<55296||n>56319||h+1===d||(l=c(p,h+1))<56320||l>57343?t?s(p,h):n:t?u(p,h,h+2):l-56320+(n-55296<<10)+65536}};t.exports={codeAt:l(!1),charAt:l(!0)}},338:(t,e,r)=>{var n=r(9413),a=r(563),o=r(211),i=r(1343);t.exports=function(){var t=a("Symbol"),e=t&&t.prototype,r=e&&e.valueOf,s=o("toPrimitive");e&&!e[s]&&i(e,s,(function(t){return n(r,this)}),{arity:1})}},7740:(t,e,r)=>{var n=r(9502),a=Math.max,o=Math.min;t.exports=function(t,e){var r=n(t);return r<0?a(r+e,0):o(r,e)}},4088:(t,e,r)=>{var n=r(5974),a=r(9586);t.exports=function(t){return n(a(t))}},9502:(t,e,r)=>{var n=r(5681);t.exports=function(t){var e=+t;return e!=e||0===e?0:n(e)}},4005:(t,e,r)=>{var n=r(9502),a=Math.min;t.exports=function(t){return t>0?a(n(t),9007199254740991):0}},3060:(t,e,r)=>{var n=r(9586),a=Object;t.exports=function(t){return a(n(t))}},1288:(t,e,r)=>{var n=r(9413),a=r(8759),o=r(2071),i=r(2964),s=r(7999),c=r(211),u=TypeError,l=c("toPrimitive");t.exports=function(t,e){if(!a(t)||o(t))return t;var r,c=i(t,l);if(c){if(void 0===e&&(e="default"),r=n(c,t,e),!a(r)||o(r))return r;throw u("Can't convert object to primitive value")}return void 0===e&&(e="number"),s(t,e)}},2258:(t,e,r)=>{var n=r(1288),a=r(2071);t.exports=function(t){var e=n(t,"string");return a(e)?e:e+""}},2371:(t,e,r)=>{var n={};n[r(211)("toStringTag")]="z",t.exports="[object z]"===String(n)},4059:(t,e,r)=>{var n=r(375),a=String;t.exports=function(t){if("Symbol"===n(t))throw TypeError("Cannot convert a Symbol value to a string");return a(t)}},9268:t=>{var e=String;t.exports=function(t){try{return e(t)}catch(t){return"Object"}}},5422:(t,e,r)=>{var n=r(8240),a=0,o=Math.random(),i=n(1..toString);t.exports=function(t){return"Symbol("+(void 0===t?"":t)+")_"+i(++a+o,36)}},1876:(t,e,r)=>{var n=r(3193);t.exports=n&&!Symbol.sham&&"symbol"==typeof Symbol.iterator},8202:(t,e,r)=>{var n=r(5283),a=r(3677);t.exports=n&&a((function(){return 42!=Object.defineProperty((function(){}),"prototype",{value:42,writable:!1}).prototype}))},9251:(t,e,r)=>{var n=r(211);e.f=n},211:(t,e,r)=>{var n=r(2086),a=r(9197),o=r(9606),i=r(5422),s=r(3193),c=r(1876),u=a("wks"),l=n.Symbol,p=l&&l.for,h=c?l:l&&l.withoutSetter||i;t.exports=function(t){if(!o(u,t)||!s&&"string"!=typeof u[t]){var e="Symbol."+t;s&&o(l,t)?u[t]=l[t]:u[t]=c&&p?p(e):h(e)}return u[t]}},3938:(t,e,r)=>{"use strict";var n=r(1695),a=r(3677),o=r(6526),i=r(8759),s=r(3060),c=r(2871),u=r(7620),l=r(9720),p=r(5574),h=r(9955),d=r(211),f=r(1448),v=d("isConcatSpreadable"),m=f>=51||!a((function(){var t=[];return t[v]=!1,t.concat()[0]!==t})),b=h("concat"),g=function(t){if(!i(t))return!1;var e=t[v];return void 0!==e?!!e:o(t)};n({target:"Array",proto:!0,arity:1,forced:!m||!b},{concat:function(t){var e,r,n,a,o,i=s(this),h=p(i,0),d=0;for(e=-1,n=arguments.length;e<n;e++)if(g(o=-1===e?i:arguments[e]))for(a=c(o),u(d+a),r=0;r<a;r++,d++)r in o&&l(h,d,o[r]);else u(d+1),l(h,d++,o);return h.length=d,h}})},8010:(t,e,r)=>{"use strict";var n=r(1695),a=r(8062).filter;n({target:"Array",proto:!0,forced:!r(9955)("filter")},{filter:function(t){return a(this,t,arguments.length>1?arguments[1]:void 0)}})},5610:(t,e,r)=>{var n=r(1695),a=r(1842);n({target:"Array",stat:!0,forced:!r(8939)((function(t){Array.from(t)}))},{from:a})},5769:(t,e,r)=>{"use strict";var n=r(4088),a=r(8669),o=r(7719),i=r(3278),s=r(7826).f,c=r(8432),u=r(3296),l=r(5283),p="Array Iterator",h=i.set,d=i.getterFor(p);t.exports=c(Array,"Array",(function(t,e){h(this,{type:p,target:n(t),index:0,kind:e})}),(function(){var t=d(this),e=t.target,r=t.kind,n=t.index++;return!e||n>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==r?{value:n,done:!1}:"values"==r?{value:e[n],done:!1}:{value:[n,e[n]],done:!1}}),"values");var f=o.Arguments=o.Array;if(a("keys"),a("values"),a("entries"),!u&&l&&"values"!==f.name)try{s(f,"name",{value:"values"})}catch(t){}},5613:(t,e,r)=>{"use strict";var n=r(1695),a=r(8240),o=r(5974),i=r(4088),s=r(2802),c=a([].join),u=o!=Object,l=s("join",",");n({target:"Array",proto:!0,forced:u||!l},{join:function(t){return c(i(this),void 0===t?",":t)}})},1013:(t,e,r)=>{"use strict";var n=r(1695),a=r(8062).map;n({target:"Array",proto:!0,forced:!r(9955)("map")},{map:function(t){return a(this,t,arguments.length>1?arguments[1]:void 0)}})},2410:(t,e,r)=>{"use strict";var n=r(1695),a=r(6526),o=r(1956),i=r(8759),s=r(7740),c=r(2871),u=r(4088),l=r(9720),p=r(211),h=r(9955),d=r(745),f=h("slice"),v=p("species"),m=Array,b=Math.max;n({target:"Array",proto:!0,forced:!f},{slice:function(t,e){var r,n,p,h=u(this),f=c(h),g=s(t,f),y=s(void 0===e?f:e,f);if(a(h)&&(r=h.constructor,(o(r)&&(r===m||a(r.prototype))||i(r)&&null===(r=r[v]))&&(r=void 0),r===m||void 0===r))return d(h,g,y);for(n=new(void 0===r?m:r)(b(y-g,0)),p=0;g<y;g++,p++)g in h&&l(n,p,h[g]);return n.length=p,n}})},3352:(t,e,r)=>{var n=r(5283),a=r(4398).EXISTS,o=r(8240),i=r(7826).f,s=Function.prototype,c=o(s.toString),u=/function\b(?:\s|\/\*[\S\s]*?\*\/|\/\/[^\n\r]*[\n\r]+)*([^\s(/]*)/,l=o(u.exec);n&&!a&&i(s,"name",{configurable:!0,get:function(){try{return l(u,c(this))[1]}catch(t){return""}}})},5735:(t,e,r)=>{var n=r(1695),a=r(563),o=r(7258),i=r(9413),s=r(8240),c=r(3677),u=r(6526),l=r(930),p=r(8759),h=r(2071),d=r(745),f=r(3193),v=a("JSON","stringify"),m=s(/./.exec),b=s("".charAt),g=s("".charCodeAt),y=s("".replace),k=s(1..toString),w=/[\uD800-\uDFFF]/g,C=/^[\uD800-\uDBFF]$/,S=/^[\uDC00-\uDFFF]$/,x=!f||c((function(){var t=a("Symbol")();return"[null]"!=v([t])||"{}"!=v({a:t})||"{}"!=v(Object(t))})),O=c((function(){return'"\\udf06\\ud834"'!==v("\udf06\ud834")||'"\\udead"'!==v("\udead")})),E=function(t,e){var r=d(arguments),n=e;if((p(e)||void 0!==t)&&!h(t))return u(e)||(e=function(t,e){if(l(n)&&(e=i(n,this,t,e)),!h(e))return e}),r[1]=e,o(v,null,r)},L=function(t,e,r){var n=b(r,e-1),a=b(r,e+1);return m(C,t)&&!m(S,a)||m(S,t)&&!m(C,n)?"\\u"+k(g(t,0),16):t};v&&n({target:"JSON",stat:!0,arity:3,forced:x||O},{stringify:function(t,e,r){var n=d(arguments),a=o(x?E:v,null,n);return O&&"string"==typeof a?y(a,w,L):a}})},8410:(t,e,r)=>{var n=r(1695),a=r(8675);n({target:"Object",stat:!0,arity:2,forced:Object.assign!==a},{assign:a})},4844:(t,e,r)=>{var n=r(1695),a=r(6910),o=r(3677),i=r(8759),s=r(2423).onFreeze,c=Object.freeze;n({target:"Object",stat:!0,forced:o((function(){c(1)})),sham:!a},{freeze:function(t){return c&&i(t)?c(s(t)):t}})},252:(t,e,r)=>{var n=r(1695),a=r(3677),o=r(4088),i=r(4399).f,s=r(5283),c=a((function(){i(1)}));n({target:"Object",stat:!0,forced:!s||c,sham:!s},{getOwnPropertyDescriptor:function(t,e){return i(o(t),e)}})},4009:(t,e,r)=>{var n=r(1695),a=r(5283),o=r(6095),i=r(4088),s=r(4399),c=r(9720);n({target:"Object",stat:!0,sham:!a},{getOwnPropertyDescriptors:function(t){for(var e,r,n=i(t),a=s.f,u=o(n),l={},p=0;u.length>p;)void 0!==(r=a(n,e=u[p++]))&&c(l,e,r);return l}})},883:(t,e,r)=>{var n=r(1695),a=r(3193),o=r(3677),i=r(6952),s=r(3060);n({target:"Object",stat:!0,forced:!a||o((function(){i.f(1)}))},{getOwnPropertySymbols:function(t){var e=i.f;return e?e(s(t)):[]}})},2274:(t,e,r)=>{var n=r(1695),a=r(3677),o=r(3060),i=r(2130),s=r(7209);n({target:"Object",stat:!0,forced:a((function(){i(1)})),sham:!s},{getPrototypeOf:function(t){return i(o(t))}})},2571:(t,e,r)=>{var n=r(1695),a=r(3060),o=r(8779);n({target:"Object",stat:!0,forced:r(3677)((function(){o(1)}))},{keys:function(t){return o(a(t))}})},3238:(t,e,r)=>{var n=r(2371),a=r(1343),o=r(999);n||a(Object.prototype,"toString",o,{unsafe:!0})},3214:(t,e,r)=>{var n=r(1695),a=r(563),o=r(7258),i=r(2395),s=r(1449),c=r(6112),u=r(8759),l=r(4710),p=r(3677),h=a("Reflect","construct"),d=Object.prototype,f=[].push,v=p((function(){function t(){}return!(h((function(){}),[],t)instanceof t)})),m=!p((function(){h((function(){}))})),b=v||m;n({target:"Reflect",stat:!0,forced:b,sham:b},{construct:function(t,e){s(t),c(e);var r=arguments.length<3?t:s(arguments[2]);if(m&&!v)return h(t,e,r);if(t==r){switch(e.length){case 0:return new t;case 1:return new t(e[0]);case 2:return new t(e[0],e[1]);case 3:return new t(e[0],e[1],e[2]);case 4:return new t(e[0],e[1],e[2],e[3])}var n=[null];return o(f,n,e),new(o(i,t,n))}var a=r.prototype,p=l(u(a)?a:d),b=o(t,p,e);return u(b)?b:p}})},2077:(t,e,r)=>{"use strict";var n=r(1695),a=r(4861);n({target:"RegExp",proto:!0,forced:/./.exec!==a},{exec:a})},895:(t,e,r)=>{"use strict";var n=r(4398).PROPER,a=r(1343),o=r(6112),i=r(4059),s=r(3677),c=r(9028),u="toString",l=RegExp.prototype[u],p=s((function(){return"/a/b"!=l.call({source:"a",flags:"b"})})),h=n&&l.name!=u;(p||h)&&a(RegExp.prototype,u,(function(){var t=o(this);return"/"+i(t.source)+"/"+i(c(t))}),{unsafe:!0})},7460:(t,e,r)=>{"use strict";var n=r(3448).charAt,a=r(4059),o=r(3278),i=r(8432),s="String Iterator",c=o.set,u=o.getterFor(s);i(String,"String",(function(t){c(this,{type:s,string:a(t),index:0})}),(function(){var t,e=u(this),r=e.string,a=e.index;return a>=r.length?{value:void 0,done:!0}:(t=n(r,a),e.index+=t.length,{value:t,done:!1})}))},911:(t,e,r)=>{"use strict";var n=r(7258),a=r(9413),o=r(8240),i=r(2331),s=r(3677),c=r(6112),u=r(930),l=r(9502),p=r(4005),h=r(4059),d=r(9586),f=r(9966),v=r(2964),m=r(8509),b=r(1189),g=r(211)("replace"),y=Math.max,k=Math.min,w=o([].concat),C=o([].push),S=o("".indexOf),x=o("".slice),O="$0"==="a".replace(/./,"$0"),E=!!/./[g]&&""===/./[g]("a","$0");i("replace",(function(t,e,r){var o=E?"$":"$0";return[function(t,r){var n=d(this),o=null==t?void 0:v(t,g);return o?a(o,t,n,r):a(e,h(n),t,r)},function(t,a){var i=c(this),s=h(t);if("string"==typeof a&&-1===S(a,o)&&-1===S(a,"$<")){var d=r(e,i,s,a);if(d.done)return d.value}var v=u(a);v||(a=h(a));var g=i.global;if(g){var O=i.unicode;i.lastIndex=0}for(var E=[];;){var L=b(i,s);if(null===L)break;if(C(E,L),!g)break;""===h(L[0])&&(i.lastIndex=f(s,p(i.lastIndex),O))}for(var P,A="",T=0,j=0;j<E.length;j++){for(var I=h((L=E[j])[0]),M=y(k(l(L.index),s.length),0),B=[],F=1;F<L.length;F++)C(B,void 0===(P=L[F])?P:String(P));var R=L.groups;if(v){var N=w([I],B,M,s);void 0!==R&&C(N,R);var D=h(n(a,void 0,N))}else D=m(I,s,M,B,R,a);M>=T&&(A+=x(s,T,M)+D,T=M+I.length)}return A+x(s,T)}]}),!!s((function(){var t=/./;return t.exec=function(){var t=[];return t.groups={a:"7"},t},"7"!=="".replace(t,"$<a>")}))||!O||E)},2482:(t,e,r)=>{"use strict";var n=r(7258),a=r(9413),o=r(8240),i=r(2331),s=r(7994),c=r(6112),u=r(9586),l=r(8515),p=r(9966),h=r(4005),d=r(4059),f=r(2964),v=r(3329),m=r(1189),b=r(4861),g=r(4930),y=r(3677),k=g.UNSUPPORTED_Y,w=4294967295,C=Math.min,S=[].push,x=o(/./.exec),O=o(S),E=o("".slice);i("split",(function(t,e,r){var o;return o="c"=="abbc".split(/(b)*/)[1]||4!="test".split(/(?:)/,-1).length||2!="ab".split(/(?:ab)*/).length||4!=".".split(/(.?)(.?)/).length||".".split(/()()/).length>1||"".split(/.?/).length?function(t,r){var o=d(u(this)),i=void 0===r?w:r>>>0;if(0===i)return[];if(void 0===t)return[o];if(!s(t))return a(e,o,t,i);for(var c,l,p,h=[],f=(t.ignoreCase?"i":"")+(t.multiline?"m":"")+(t.unicode?"u":"")+(t.sticky?"y":""),m=0,g=new RegExp(t.source,f+"g");(c=a(b,g,o))&&!((l=g.lastIndex)>m&&(O(h,E(o,m,c.index)),c.length>1&&c.index<o.length&&n(S,h,v(c,1)),p=c[0].length,m=l,h.length>=i));)g.lastIndex===c.index&&g.lastIndex++;return m===o.length?!p&&x(g,"")||O(h,""):O(h,E(o,m)),h.length>i?v(h,0,i):h}:"0".split(void 0,0).length?function(t,r){return void 0===t&&0===r?[]:a(e,this,t,r)}:e,[function(e,r){var n=u(this),i=null==e?void 0:f(e,t);return i?a(i,e,n,r):a(o,d(n),e,r)},function(t,n){var a=c(this),i=d(t),s=r(o,a,i,n,o!==e);if(s.done)return s.value;var u=l(a,RegExp),f=a.unicode,v=(a.ignoreCase?"i":"")+(a.multiline?"m":"")+(a.unicode?"u":"")+(k?"g":"y"),b=new u(k?"^(?:"+a.source+")":a,v),g=void 0===n?w:n>>>0;if(0===g)return[];if(0===i.length)return null===m(b,i)?[i]:[];for(var y=0,S=0,x=[];S<i.length;){b.lastIndex=k?0:S;var L,P=m(b,k?E(i,S):i);if(null===P||(L=C(h(b.lastIndex+(k?S:0)),i.length))===y)S=p(i,S,f);else{if(O(x,E(i,y,S)),x.length===g)return x;for(var A=1;A<=P.length-1;A++)if(O(x,P[A]),x.length===g)return x;S=y=L}}return O(x,E(i,y)),x}]}),!!y((function(){var t=/(?:)/,e=t.exec;t.exec=function(){return e.apply(this,arguments)};var r="ab".split(t);return 2!==r.length||"a"!==r[0]||"b"!==r[1]})),k)},4211:(t,e,r)=>{"use strict";var n=r(1695),a=r(2086),o=r(9413),i=r(8240),s=r(3296),c=r(5283),u=r(3193),l=r(3677),p=r(9606),h=r(5516),d=r(6112),f=r(4088),v=r(2258),m=r(4059),b=r(5736),g=r(4710),y=r(8779),k=r(62),w=r(3226),C=r(6952),S=r(4399),x=r(7826),O=r(7711),E=r(7446),L=r(1343),P=r(9197),A=r(8944),T=r(7153),j=r(5422),I=r(211),M=r(9251),B=r(4145),F=r(338),R=r(914),N=r(3278),D=r(8062).forEach,H=A("hidden"),_="Symbol",z="prototype",q=N.set,U=N.getterFor(_),W=Object[z],V=a.Symbol,$=V&&V[z],G=a.TypeError,X=a.QObject,J=S.f,Y=x.f,K=w.f,Q=E.f,Z=i([].push),tt=P("symbols"),et=P("op-symbols"),rt=P("wks"),nt=!X||!X[z]||!X[z].findChild,at=c&&l((function(){return 7!=g(Y({},"a",{get:function(){return Y(this,"a",{value:7}).a}})).a}))?function(t,e,r){var n=J(W,e);n&&delete W[e],Y(t,e,r),n&&t!==W&&Y(W,e,n)}:Y,ot=function(t,e){var r=tt[t]=g($);return q(r,{type:_,tag:t,description:e}),c||(r.description=e),r},it=function(t,e,r){t===W&&it(et,e,r),d(t);var n=v(e);return d(r),p(tt,n)?(r.enumerable?(p(t,H)&&t[H][n]&&(t[H][n]=!1),r=g(r,{enumerable:b(0,!1)})):(p(t,H)||Y(t,H,b(1,{})),t[H][n]=!0),at(t,n,r)):Y(t,n,r)},st=function(t,e){d(t);var r=f(e),n=y(r).concat(pt(r));return D(n,(function(e){c&&!o(ct,r,e)||it(t,e,r[e])})),t},ct=function(t){var e=v(t),r=o(Q,this,e);return!(this===W&&p(tt,e)&&!p(et,e))&&(!(r||!p(this,e)||!p(tt,e)||p(this,H)&&this[H][e])||r)},ut=function(t,e){var r=f(t),n=v(e);if(r!==W||!p(tt,n)||p(et,n)){var a=J(r,n);return!a||!p(tt,n)||p(r,H)&&r[H][n]||(a.enumerable=!0),a}},lt=function(t){var e=K(f(t)),r=[];return D(e,(function(t){p(tt,t)||p(T,t)||Z(r,t)})),r},pt=function(t){var e=t===W,r=K(e?et:f(t)),n=[];return D(r,(function(t){!p(tt,t)||e&&!p(W,t)||Z(n,tt[t])})),n};u||(L($=(V=function(){if(h($,this))throw G("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?m(arguments[0]):void 0,e=j(t),r=function(t){this===W&&o(r,et,t),p(this,H)&&p(this[H],e)&&(this[H][e]=!1),at(this,e,b(1,t))};return c&&nt&&at(W,e,{configurable:!0,set:r}),ot(e,t)})[z],"toString",(function(){return U(this).tag})),L(V,"withoutSetter",(function(t){return ot(j(t),t)})),E.f=ct,x.f=it,O.f=st,S.f=ut,k.f=w.f=lt,C.f=pt,M.f=function(t){return ot(I(t),t)},c&&(Y($,"description",{configurable:!0,get:function(){return U(this).description}}),s||L(W,"propertyIsEnumerable",ct,{unsafe:!0}))),n({global:!0,constructor:!0,wrap:!0,forced:!u,sham:!u},{Symbol:V}),D(y(rt),(function(t){B(t)})),n({target:_,stat:!0,forced:!u},{useSetter:function(){nt=!0},useSimple:function(){nt=!1}}),n({target:"Object",stat:!0,forced:!u,sham:!c},{create:function(t,e){return void 0===e?g(t):st(g(t),e)},defineProperty:it,defineProperties:st,getOwnPropertyDescriptor:ut}),n({target:"Object",stat:!0,forced:!u},{getOwnPropertyNames:lt}),F(),R(V,_),T[H]=!0},2189:(t,e,r)=>{"use strict";var n=r(1695),a=r(5283),o=r(2086),i=r(8240),s=r(9606),c=r(930),u=r(5516),l=r(4059),p=r(7826).f,h=r(8474),d=o.Symbol,f=d&&d.prototype;if(a&&c(d)&&(!("description"in f)||void 0!==d().description)){var v={},m=function(){var t=arguments.length<1||void 0===arguments[0]?void 0:l(arguments[0]),e=u(f,this)?new d(t):void 0===t?d():d(t);return""===t&&(v[e]=!0),e};h(m,d),m.prototype=f,f.constructor=m;var b="Symbol(test)"==String(d("test")),g=i(f.toString),y=i(f.valueOf),k=/^Symbol\((.*)\)[^)]+$/,w=i("".replace),C=i("".slice);p(f,"description",{configurable:!0,get:function(){var t=y(this),e=g(t);if(s(v,t))return"";var r=b?C(e,7,-1):w(e,k,"$1");return""===r?void 0:r}}),n({global:!0,constructor:!0,forced:!0},{Symbol:m})}},8028:(t,e,r)=>{var n=r(1695),a=r(563),o=r(9606),i=r(4059),s=r(9197),c=r(3441),u=s("string-to-symbol-registry"),l=s("symbol-to-string-registry");n({target:"Symbol",stat:!0,forced:!c},{for:function(t){var e=i(t);if(o(u,e))return u[e];var r=a("Symbol")(e);return u[e]=r,l[r]=e,r}})},1047:(t,e,r)=>{r(4145)("iterator")},5901:(t,e,r)=>{r(4211),r(8028),r(9819),r(5735),r(883)},9819:(t,e,r)=>{var n=r(1695),a=r(9606),o=r(2071),i=r(9268),s=r(9197),c=r(3441),u=s("symbol-to-string-registry");n({target:"Symbol",stat:!0,forced:!c},{keyFor:function(t){if(!o(t))throw TypeError(i(t)+" is not a symbol");if(a(u,t))return u[t]}})},5849:(t,e,r)=>{var n=r(2086),a=r(933),o=r(3526),i=r(1984),s=r(2585),c=function(t){if(t&&t.forEach!==i)try{s(t,"forEach",i)}catch(e){t.forEach=i}};for(var u in a)a[u]&&c(n[u]&&n[u].prototype);c(o)},4078:(t,e,r)=>{var n=r(2086),a=r(933),o=r(3526),i=r(5769),s=r(2585),c=r(211),u=c("iterator"),l=c("toStringTag"),p=i.values,h=function(t,e){if(t){if(t[u]!==p)try{s(t,u,p)}catch(e){t[u]=p}if(t[l]||s(t,l,e),a[e])for(var r in i)if(t[r]!==i[r])try{s(t,r,i[r])}catch(e){t[r]=i[r]}}};for(var d in a)h(n[d]&&n[d].prototype,d);h(o,"DOMTokenList")},2062:()=>{var t;t=function(t){return t=+t,isNaN(t)||t==1/0||t==-1/0?0:t},Element.prototype.scroll||(Element.prototype.scroll=function(){var e,r,n=arguments.length,a=this.ownerDocument,o=a.defaultView,i="BackCompat"==a.compatMode,s=document.getElementsByTagName("BODY")[0],c={};if(a==window.document&&o&&0!==n){if(1===n){var u=arguments[0];if("object"!=typeof u)throw"Failed to execute 'scrollBy' on 'Element': parameter 1 ('options') is not an object.";"left"in u&&(c.left=t(u.left)),"top"in u&&(c.top=t(u.top)),e="left"in c?c.left:this.scrollLeft,r="top"in c?c.top:this.scrollTop}else c.left=e=t(arguments[0]),c.top=r=t(arguments[1]);if(this!=document.documentElement)this!=s||!i||function(t){t=t||document.getElementsByTagName("BODY")[0];var e=window.getComputedStyle(t),r=window.getComputedStyle(t.parent),n=e.overflowX,a=e.overflowY,o=r.overflowX,i=r.overflowY;return("table-column"==e.display||"table-column-group"==e.display)&&"visible"!=o&&"clip"!=o&&"visible"!=i&&"clip"!=i&&"visible"!=n&&"clip"!=n&&"visible"!=a&&"clip"!=a}(s)?(this.scrollLeft=e,this.scrollTop=r):o.scroll(c.left,c.top);else{if(i)return;o.scroll("scrollX"in o?o.scrollX:"pageXOffset"in o?o.pageXOffset:this.scrollLeft,r)}}}),Element.prototype.scrollTo||(Element.prototype.scrollTo=Element.prototype.scroll),Element.prototype.scrollBy||(Element.prototype.scrollBy=function(){var e=arguments.length,r={};if(0!==e){if(1===e){var n=arguments[0];if("object"!=typeof n)throw"Failed to execute 'scrollBy' on 'Element': parameter 1 ('options') is not an object.";"left"in n&&(r.left=t(n.left)),"top"in n&&(r.top=t(n.top))}else r.left=t(arguments[0]),r.top=t(arguments[1]);r.left="left"in r?r.left+this.scrollLeft:this.scrollLeft,r.top="top"in r?r.top+this.scrollTop:this.scrollTop,this.scroll(r)}})},7190:t=>{t.exports=function(t){return!(!t||"string"==typeof t)&&(t instanceof Array||Array.isArray(t)||t.length>=0&&(t.splice instanceof Function||Object.getOwnPropertyDescriptor(t,t.length-1)&&"String"!==t.constructor.name))}},7159:(t,e,r)=>{var n,a,o;a=[r(5998)],void 0===(o="function"==typeof(n=function(t){function e(t){this.init(t)}e.prototype={value:0,size:100,startAngle:-Math.PI,thickness:"auto",fill:{gradient:["#3aeabb","#fdd250"]},emptyFill:"rgba(0, 0, 0, .1)",animation:{duration:1200,easing:"circleProgressEasing"},animationStartValue:0,reverse:!1,lineCap:"butt",insertMode:"prepend",constructor:e,el:null,canvas:null,ctx:null,radius:0,arcFill:null,lastFrameValue:0,init:function(e){t.extend(this,e),this.radius=this.size/2,this.initWidget(),this.initFill(),this.draw(),this.el.trigger("circle-inited")},initWidget:function(){this.canvas||(this.canvas=t("<canvas>")["prepend"==this.insertMode?"prependTo":"appendTo"](this.el)[0]);var e=this.canvas;if(e.width=this.size,e.height=this.size,this.ctx=e.getContext("2d"),window.devicePixelRatio>1){var r=window.devicePixelRatio;e.style.width=e.style.height=this.size+"px",e.width=e.height=this.size*r,this.ctx.scale(r,r)}},initFill:function(){var e,r=this,n=this.fill,a=this.ctx,o=this.size;if(!n)throw Error("The fill is not specified!");if("string"==typeof n&&(n={color:n}),n.color&&(this.arcFill=n.color),n.gradient){var i=n.gradient;if(1==i.length)this.arcFill=i[0];else if(i.length>1){for(var s=n.gradientAngle||0,c=n.gradientDirection||[o/2*(1-Math.cos(s)),o/2*(1+Math.sin(s)),o/2*(1+Math.cos(s)),o/2*(1-Math.sin(s))],u=a.createLinearGradient.apply(a,c),l=0;l<i.length;l++){var p=i[l],h=l/(i.length-1);t.isArray(p)&&(h=p[1],p=p[0]),u.addColorStop(h,p)}this.arcFill=u}}function d(){var n=t("<canvas>")[0];n.width=r.size,n.height=r.size,n.getContext("2d").drawImage(e,0,0,o,o),r.arcFill=r.ctx.createPattern(n,"no-repeat"),r.drawFrame(r.lastFrameValue)}n.image&&(n.image instanceof Image?e=n.image:(e=new Image).src=n.image,e.complete?d():e.onload=d)},draw:function(){this.animation?this.drawAnimated(this.value):this.drawFrame(this.value)},drawFrame:function(t){this.lastFrameValue=t,this.ctx.clearRect(0,0,this.size,this.size),this.drawEmptyArc(t),this.drawArc(t)},drawArc:function(t){if(0!==t){var e=this.ctx,r=this.radius,n=this.getThickness(),a=this.startAngle;e.save(),e.beginPath(),this.reverse?e.arc(r,r,r-n/2,a-2*Math.PI*t,a):e.arc(r,r,r-n/2,a,a+2*Math.PI*t),e.lineWidth=n,e.lineCap=this.lineCap,e.strokeStyle=this.arcFill,e.stroke(),e.restore()}},drawEmptyArc:function(t){var e=this.ctx,r=this.radius,n=this.getThickness(),a=this.startAngle;t<1&&(e.save(),e.beginPath(),t<=0?e.arc(r,r,r-n/2,0,2*Math.PI):this.reverse?e.arc(r,r,r-n/2,a,a-2*Math.PI*t):e.arc(r,r,r-n/2,a+2*Math.PI*t,a),e.lineWidth=n,e.strokeStyle=this.emptyFill,e.stroke(),e.restore())},drawAnimated:function(e){var r=this,n=this.el,a=t(this.canvas);a.stop(!0,!1),n.trigger("circle-animation-start"),a.css({animationProgress:0}).animate({animationProgress:1},t.extend({},this.animation,{step:function(t){var a=r.animationStartValue*(1-t)+e*t;r.drawFrame(a),n.trigger("circle-animation-progress",[t,a])}})).promise().always((function(){n.trigger("circle-animation-end")}))},getThickness:function(){return t.isNumeric(this.thickness)?this.thickness:this.size/14},getValue:function(){return this.value},setValue:function(t){this.animation&&(this.animationStartValue=this.lastFrameValue),this.value=t,this.draw()}},t.circleProgress={defaults:e.prototype},t.easing.circleProgressEasing=function(t){return t<.5?.5*(t*=2)*t*t:1-.5*(t=2-2*t)*t*t},t.fn.circleProgress=function(r,n){var a="circle-progress",o=this.data(a);if("widget"==r){if(!o)throw Error('Calling "widget" method on not initialized instance is forbidden');return o.canvas}if("value"==r){if(!o)throw Error('Calling "value" method on not initialized instance is forbidden');if(void 0===n)return o.getValue();var i=arguments[1];return this.each((function(){t(this).data(a).setValue(i)}))}return this.each((function(){var n=t(this),o=n.data(a),i=t.isPlainObject(r)?r:{};if(o)o.init(i);else{var s=t.extend({},n.data());"string"==typeof s.fill&&(s.fill=JSON.parse(s.fill)),"string"==typeof s.animation&&(s.animation=JSON.parse(s.animation)),(i=t.extend(s,i)).el=n,o=new e(i),n.data(a,o)}}))}})?n.apply(e,a):n)||(t.exports=o)},521:(t,e,r)=>{"use strict";var n=r(7190),a=Array.prototype.concat,o=Array.prototype.slice,i=t.exports=function(t){for(var e=[],r=0,i=t.length;r<i;r++){var s=t[r];n(s)?e=a.call(e,o.call(s)):e.push(s)}return e};i.wrap=function(t){return function(){return t(i(arguments))}}},5998:t=>{"use strict";t.exports=H5P.jQuery}},e={};function r(n){var a=e[n];if(void 0!==a)return a.exports;var o=e[n]={exports:{}};return t[n](o,o.exports,r),o.exports}r.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return r.d(e,{a:e}),e},r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),(()=>{"use strict";r(3214),r(8410),r(2571),r(5901),r(252),r(4009),r(2189),r(1047),r(5769),r(7460),r(4078),r(3238),r(5849),r(1013),r(8010),r(3938),r(2410),r(2077),r(911),r(2274),r(2482),r(5613),r(895);function t(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}const e=function(){function e(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,e)}var r,n,a;return r=e,a=[{key:"extractFragmentsFromURL",value:function(t,e){if(!e.location.hash)return{};var r={};return e.location.hash.replace("#","").split("&").forEach((function(t){if(-1!==t.indexOf("=")){var e=t.split("=");r[e[0]]=e[1]}})),"function"!=typeof t||t(r)?r:{}}},{key:"createFragmentsString",value:function(t){var e=[];for(var r in t)e.push("".concat(r,"=").concat(t[r]));return"#".concat(e.join("&"))}},{key:"areFragmentsEqual",value:function(t,e){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[];for(var n in t)if(t.hasOwnProperty(n)){if(r.length>0&&-1===r.indexOf(n))continue;if(!e[n]||t[n].toString()!==e[n].toString())return!1}return!0}}],(n=null)&&t(r.prototype,n),a&&t(r,a),Object.defineProperty(r,"prototype",{writable:!1}),e}();r(4844),r(3352),r(5610);function n(t){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n(t)}function a(t,e){var r="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=function(t,e){if(!t)return;if("string"==typeof t)return o(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);"Object"===r&&t.constructor&&(r=t.constructor.name);if("Map"===r||"Set"===r)return Array.from(t);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return o(t,e)}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,a=function(){};return{s:a,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:a}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,s=!0,c=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return s=t.done,t},e:function(t){c=!0,i=t},f:function(){try{s||null==r.return||r.return()}finally{if(c)throw i}}}}function o(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function i(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function s(t,e){return s=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},s(t,e)}function c(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var r,a=u(t);if(e){var o=u(this).constructor;r=Reflect.construct(a,arguments,o)}else r=a.apply(this,arguments);return function(t,e){if(e&&("object"===n(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t)}(this,r)}}function u(t){return u=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},u(t)}const l=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&s(t,e)}(u,H5P.EventDispatcher);var e,r,n,o=c(u);function u(t,e,r,n){var a;return function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,u),(a=o.call(this)).id=e,a.parent=n,a.behaviour=t.behaviour,a.content=document.createElement("ul"),a.content.classList.add("navigation-list"),a.container=a.addSideBar(),a.l10n=t.l10n,a.chapters=a.findAllChapters(t.chapters),a.chapterNodes=a.getChapterNodes(),r&&(a.titleElem=a.addMainTitle(r),a.container.appendChild(a.titleElem)),a.chapterNodes.forEach((function(t){a.content.appendChild(t)})),a.chapters.length>20&&a.content.classList.add("large-navigation-list"),a.container.appendChild(a.content),a.addTransformListener(),a.initializeNavigationControls(),a}return e=u,r=[{key:"initializeNavigationControls",value:function(){var t=this,e=Object.freeze({UP:38,DOWN:40});this.chapterNodes.forEach((function(r,n){r.querySelector(".h5p-interactive-book-navigation-chapter-button").addEventListener("keydown",(function(r){switch(r.keyCode){case e.UP:t.setFocusToChapterItem(n,-1),r.preventDefault();break;case e.DOWN:t.setFocusToChapterItem(n,1),r.preventDefault()}}));for(var a=r.querySelectorAll(".h5p-interactive-book-navigation-section"),o=function(r){a[r].querySelector(".section-button").addEventListener("keydown",(function(a){switch(a.keyCode){case e.UP:t.setFocusToSectionItem(n,r,-1),a.preventDefault();break;case e.DOWN:t.setFocusToSectionItem(n,r,1),a.preventDefault()}}))},i=0;i<a.length;i++)o(i)}))}},{key:"focus",value:function(){this.content.querySelector("button").focus()}},{key:"setFocusToChapterItem",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,r=t+e;if(r<0?r=this.chapterNodes.length-1:r>this.chapterNodes.length-1&&(r=0),e){var n=e>0?t:r,a=this.chapterNodes[n];if(!a.classList.contains("h5p-interactive-book-navigation-closed")){var o=a.querySelectorAll(".h5p-interactive-book-navigation-section");if(o.length){var i=e>0?0:o.length-1;return void this.setFocusToSectionItem(n,i)}}}var s=this.chapterNodes[r].querySelector(".h5p-interactive-book-navigation-chapter-button");this.setFocusToItem(s,r)}},{key:"setFocusToSectionItem",value:function(t,e){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0,n=this.chapterNodes[t].querySelectorAll(".h5p-interactive-book-navigation-section"),a=e+r;if(a>n.length-1)this.setFocusToChapterItem(t+1);else if(a<0)this.setFocusToChapterItem(t);else{var o=n[a].querySelector(".section-button");this.setFocusToItem(o,t)}}},{key:"setFocusToItem",value:function(t,e){var r=arguments.length>2&&void 0!==arguments[2]&&arguments[2];this.chapterNodes.forEach((function(t,r){var n=t.querySelector(".h5p-interactive-book-navigation-chapter-button");r===e?n.classList.add("h5p-interactive-book-navigation-current"):n.classList.remove("h5p-interactive-book-navigation-current"),n.setAttribute("tabindex","-1");for(var a=t.querySelectorAll(".h5p-interactive-book-navigation-section"),o=0;o<a.length;o++)a[o].querySelector(".section-button").setAttribute("tabindex","-1")})),t.setAttribute("tabindex","0"),this.focusedChapter=e,r||t.focus()}},{key:"addSideBar",value:function(){var t=document.createElement("div");return t.id="h5p-interactive-book-navigation-menu",t.classList.add("h5p-interactive-book-navigation"),t}},{key:"addMainTitle",value:function(t){var e=document.createElement("h2");e.classList.add("navigation-title"),e.innerHTML=t,e.setAttribute("title",t);var r=document.createElement("div");return r.classList.add("h5p-interactive-book-navigation-maintitle"),r.appendChild(e),r}},{key:"findSectionsInChapter",value:function(t){for(var e=[],r=t.params.content,n=0;n<r.length;n++){var a=r[n].content,o="";o="H5P.Link"===a.library.split(" ")[0]?a.params.title?a.params.title:"New link":a.metadata.title,e.push({title:o,id:a.subContentId?"h5p-interactive-book-section-".concat(a.subContentId):void 0})}return e}},{key:"findAllChapters",value:function(t){for(var e=[],r=0;r<t.length;r++){var n=this.findSectionsInChapter(t[r]),a=t[r].metadata.title,o="h5p-interactive-book-chapter-".concat(t[r].subContentId);e.push({sections:n,title:a,id:o,isSummary:!1})}return this.parent.hasSummary()&&e.push({sections:[],title:this.l10n.summaryHeader,id:"h5p-interactive-book-chapter-summary",isSummary:!0}),e}},{key:"toggleChapter",value:function(t,e){e=void 0!==e?e:!t.classList.contains("h5p-interactive-book-navigation-closed");var r=t.querySelector(".h5p-interactive-book-navigation-sectionlist"),n=t.getElementsByClassName("h5p-interactive-book-navigation-chapter-accordion")[0];t.querySelector(".h5p-interactive-book-navigation-chapter-button").setAttribute("aria-expanded",(!e).toString()),!0===e?(t.classList.add("h5p-interactive-book-navigation-closed"),n&&(n.classList.remove("icon-expanded"),n.classList.add("icon-collapsed"),r&&(r.setAttribute("aria-hidden",!0),r.setAttribute("tabindex","-1")))):(t.classList.remove("h5p-interactive-book-navigation-closed"),n&&(n.classList.remove("icon-collapsed"),n.classList.add("icon-expanded"),r&&(r.removeAttribute("aria-hidden"),r.removeAttribute("tabindex"))))}},{key:"redirectHandler",value:function(t){var e=this;if(this.chapterNodes.forEach((function(r,n){e.toggleChapter(r,n!==t)})),this.parent.trigger("resize"),t!==this.focusedChapter){var r=this.chapterNodes[t].querySelector(".h5p-interactive-book-navigation-chapter-button");this.setFocusToItem(r,t,!0)}}},{key:"resetIndicators",value:function(){var t=this;this.chapterNodes.forEach((function(e,r){t.updateChapterProgressIndicator(r,"BLANK");var n,o=a(e.getElementsByClassName("h5p-interactive-book-navigation-section"));try{for(o.s();!(n=o.n()).done;){var i=n.value.querySelector(".h5p-interactive-book-navigation-section-icon");i&&(i.classList.remove("icon-question-answered"),i.classList.add("icon-chapter-blank"))}}catch(t){o.e(t)}finally{o.f()}}))}},{key:"updateChapterProgressIndicator",value:function(t,e){if(this.behaviour.progressIndicators&&!this.chapters[t].isSummary){var r=this.chapterNodes[t].getElementsByClassName("h5p-interactive-book-navigation-chapter-progress")[0];"BLANK"===e?(r.classList.remove("icon-chapter-started"),r.classList.remove("icon-chapter-done"),r.classList.add("icon-chapter-blank")):"DONE"===e?(r.classList.remove("icon-chapter-blank"),r.classList.remove("icon-chapter-started"),r.classList.add("icon-chapter-done")):"STARTED"===e&&(r.classList.remove("icon-chapter-blank"),r.classList.remove("icon-chapter-done"),r.classList.add("icon-chapter-started"))}}},{key:"setSectionMarker",value:function(t,e){var r=this.chapterNodes[t].querySelector(".h5p-interactive-book-navigation-section-"+e+" .h5p-interactive-book-navigation-section-icon");r&&(r.classList.remove("icon-chapter-blank"),r.classList.add("icon-question-answered"))}},{key:"getNodesFromChapter",value:function(t,e){var r=this,n=document.createElement("li"),a="h5p-interactive-book-sectionlist-"+e;if(n.classList.add("h5p-interactive-book-navigation-chapter"),t.isSummary){n.classList.add("h5p-interactive-book-navigation-summary-button");var o=this.parent.chapters[e].instance.summaryMenuButton;return o.classList.add("h5p-interactive-book-navigation-chapter-button"),n.appendChild(o),n}var i=document.createElement("div");i.classList.add("h5p-interactive-book-navigation-chapter-accordion");var s=document.createElement("div");s.classList.add("h5p-interactive-book-navigation-chapter-title-text"),s.innerHTML=t.title,s.setAttribute("title",t.title);var c=document.createElement("div");this.behaviour.progressIndicators&&(c.classList.add("icon-chapter-blank"),c.classList.add("h5p-interactive-book-navigation-chapter-progress"));var u=document.createElement("button");u.setAttribute("tabindex",0===e?"0":"-1"),u.classList.add("h5p-interactive-book-navigation-chapter-button"),this.parent.activeChapter!==e?(i.classList.add("icon-collapsed"),u.setAttribute("aria-expanded","false")):(i.classList.add("icon-expanded"),u.setAttribute("aria-expanded","true")),u.setAttribute("aria-controls",a),u.onclick=function(t){var n=!t.currentTarget.querySelector(".h5p-interactive-book-navigation-chapter-accordion").classList.contains("hidden"),a="true"===t.currentTarget.getAttribute("aria-expanded");if(r.isOpenOnMobile()&&r.parent.trigger("toggleMenu"),r.isOpenOnMobile()||!n||!a){var o={h5pbookid:r.parent.contentId,chapter:r.chapters[e].id,section:0};r.parent.trigger("newChapter",o)}n&&(r.toggleChapter(t.currentTarget.parentElement),r.parent.trigger("resize"))},u.appendChild(i),u.appendChild(s),u.appendChild(c),n.appendChild(u),this.parent.activeChapter===e?n.querySelector(".h5p-interactive-book-navigation-chapter-button").classList.add("h5p-interactive-book-navigation-current"):this.toggleChapter(n,!0);var l=document.createElement("ul");l.classList.add("h5p-interactive-book-navigation-sectionlist"),l.id=a;for(var p=[],h=0;h<this.chapters[e].sections.length;h++)if(this.parent.chapters[e].sections[h].isTask){var d=this.createSectionLink(e,h);p.push(d),l.appendChild(d)}else{var f=this.parent.params.chapters[e].params.content[h].content;if("H5P.AdvancedText"===f.library.split(" ")[0]){var v=document.createElement("div");v.innerHTML=f.params.text;for(var m=v.querySelectorAll("h2, h3"),b=0;b<m.length;b++){var g=m[b],y=this.createSectionLink(e,h,g.textContent,b);p.push(y),l.appendChild(y)}}}if(t.tasksLeft&&(t.maxTasks=t.tasksLeft),0===p.length){var k=n.querySelector(".h5p-interactive-book-navigation-chapter-accordion");k&&k.classList.add("hidden")}return n.appendChild(l),n}},{key:"createSectionLink",value:function(t,e){var r=this,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,a=arguments.length>3&&void 0!==arguments[3]?arguments[3]:null,o=this.chapters[t].sections[e],i=document.createElement("div");i.innerHTML=n||o.title,i.setAttribute("title",n||o.title),i.classList.add("h5p-interactive-book-navigation-section-title");var s=document.createElement("div");s.classList.add("h5p-interactive-book-navigation-section-icon"),s.classList.add("icon-chapter-blank"),this.parent.chapters[t].sections[e].isTask&&s.classList.add("h5p-interactive-book-navigation-section-task");var c=document.createElement("button");c.classList.add("section-button"),c.setAttribute("tabindex","-1"),c.onclick=function(e){var n={h5pbookid:r.parent.contentId,chapter:r.chapters[t].id,section:o.id};null!==a&&(n.headerNumber=a),r.parent.trigger("newChapter",n),r.isOpenOnMobile()&&r.parent.trigger("toggleMenu"),e.preventDefault()},c.appendChild(s),c.appendChild(i);var u=document.createElement("li");return u.classList.add("h5p-interactive-book-navigation-section"),u.classList.add("h5p-interactive-book-navigation-section-"+e),u.appendChild(c),u}},{key:"getChapterNodes",value:function(){var t=this;return this.chapters.map((function(e,r){return t.getNodesFromChapter(e,r)}))}},{key:"isOpenOnMobile",value:function(){return this.parent.isMenuOpen()&&this.parent.isSmallSurface()}},{key:"addTransformListener",value:function(){var t=this;this.container.addEventListener("transitionend",(function(e){"flex-basis"===e.propertyName&&t.parent.trigger("resize")}))}}],r&&i(e.prototype,r),n&&i(e,n),Object.defineProperty(e,"prototype",{writable:!1}),u}();function p(t){return p="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},p(t)}function h(){return h=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t},h.apply(this,arguments)}function d(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function f(t,e){return f=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},f(t,e)}function v(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var r,n=m(t);if(e){var a=m(this).constructor;r=Reflect.construct(n,arguments,a)}else r=n.apply(this,arguments);return function(t,e){if(e&&("object"===p(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t)}(this,r)}}function m(t){return m=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},m(t)}const b=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&f(t,e)}(o,H5P.EventDispatcher);var e,r,n,a=v(o);function o(t,e,r,n,i){var s;!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,o),(s=a.call(this)).id=t,s.parent=r,s.params=n||{},s.params.l10n=n.l10n,s.params.a11y=h({progress:"Page @page of @total",menu:"Toggle navigation menu"},s.params.a11y||{}),s.totalChapters=e,s.arrows=s.addArrows(),s.progressBar=s.createProgressBar(),s.progressIndicator=s.createProgressIndicator(),s.chapterTitle=s.createChapterTitle(),s.menuToggleButton=s.createMenuToggleButton();var c=document.createElement("div");return c.classList.add("h5p-interactive-book-status"),s.params.displayToTopButton&&c.appendChild(s.createToTopButton()),s.params.displayFullScreenButton&&H5P.fullscreenSupported&&c.appendChild(s.createFullScreenButton()),c.appendChild(s.arrows.buttonWrapperNext),c.appendChild(s.arrows.buttonWrapperPrevious),s.params.displayMenuToggleButton&&c.appendChild(s.menuToggleButton),c.appendChild(s.progressIndicator.wrapper),c.appendChild(s.chapterTitle.wrapper),s.wrapper=document.createElement("div"),s.wrapper.classList.add(i),s.wrapper.setAttribute("tabindex","-1"),s.wrapper.appendChild(s.progressBar.wrapper),s.wrapper.appendChild(c),s.on("updateStatusBar",s.updateStatusBar),s.on("seqChapter",(function(t){var e={h5pbookid:s.parent.contentId};t.data.toTop&&(e.section="top"),"next"===t.data.direction?s.parent.activeChapter+1<s.parent.chapters.length?e.chapter="h5p-interactive-book-chapter-".concat(s.parent.chapters[s.parent.activeChapter+1].instance.subContentId):s.parent.hasSummary()&&s.parent.activeChapter+1===s.parent.chapters.length&&s.parent.trigger("viewSummary",e):"prev"===t.data.direction&&s.parent.activeChapter>0&&(e.chapter="h5p-interactive-book-chapter-".concat(s.parent.chapters[s.parent.activeChapter-1].instance.subContentId)),e.chapter&&s.parent.trigger("newChapter",e)})),s}return e=o,(r=[{key:"updateProgressBar",value:function(t){var e="".concat(t/this.totalChapters*100,"%");this.progressBar.progress.style.width=e;var r=this.params.a11y.progress.replace("@page",t).replace("@total",this.totalChapters);this.progressBar.progress.title=r}},{key:"updateA11yProgress",value:function(t){this.progressIndicator.hiddenButRead.innerHTML=this.params.a11y.progress.replace("@page",t).replace("@total",this.totalChapters)}},{key:"updateStatusBar",value:function(){var t=this.parent.getActiveChapter()+1,e=this.parent.chapters[t-1].title;this.progressIndicator.current.innerHTML=t,this.updateA11yProgress(t),this.updateProgressBar(t),this.chapterTitle.text.innerHTML=e,this.chapterTitle.text.setAttribute("title",e),this.parent.activeChapter<=0?this.setButtonStatus("Previous",!0):this.setButtonStatus("Previous",!1),this.parent.activeChapter+1>=this.totalChapters?this.setButtonStatus("Next",!0):this.setButtonStatus("Next",!1)}},{key:"addArrows",value:function(){var t=this,e={};return e.buttonPrevious=document.createElement("div"),e.buttonPrevious.classList.add("navigation-button","icon-previous"),e.buttonPrevious.setAttribute("title",this.params.l10n.previousPage),e.buttonWrapperPrevious=document.createElement("button"),e.buttonWrapperPrevious.classList.add("h5p-interactive-book-status-arrow","h5p-interactive-book-status-button","previous"),e.buttonWrapperPrevious.setAttribute("aria-label",this.params.l10n.previousPage),e.buttonWrapperPrevious.onclick=function(){t.trigger("seqChapter",{direction:"prev",toTop:!0})},e.buttonWrapperPrevious.appendChild(e.buttonPrevious),e.buttonNext=document.createElement("div"),e.buttonNext.classList.add("navigation-button","icon-next"),e.buttonNext.setAttribute("title",this.params.l10n.nextPage),e.buttonWrapperNext=document.createElement("button"),e.buttonWrapperNext.classList.add("h5p-interactive-book-status-arrow","h5p-interactive-book-status-button","next"),e.buttonWrapperNext.setAttribute("aria-label",this.params.l10n.nextPage),e.buttonWrapperNext.onclick=function(){t.trigger("seqChapter",{direction:"next",toTop:!0})},e.buttonWrapperNext.appendChild(e.buttonNext),e}},{key:"createMenuToggleButton",value:function(){var t=this,e=document.createElement("a");e.classList.add("icon-menu");var r=document.createElement("button");return r.classList.add("h5p-interactive-book-status-menu"),r.classList.add("h5p-interactive-book-status-button"),r.setAttribute("aria-label",this.params.a11y.menu),r.setAttribute("aria-expanded","false"),r.setAttribute("aria-controls","h5p-interactive-book-navigation-menu"),r.onclick=function(){t.parent.trigger("toggleMenu")},r.appendChild(e),r}},{key:"isMenuOpen",value:function(){return this.menuToggleButton.classList.contains("h5p-interactive-book-status-menu-active")}},{key:"createProgressBar",value:function(){var t=document.createElement("div");t.classList.add("h5p-interactive-book-status-progressbar-front"),t.setAttribute("tabindex","-1");var e=document.createElement("div");return e.classList.add("h5p-interactive-book-status-progressbar-back"),e.appendChild(t),{wrapper:e,progress:t}}},{key:"createChapterTitle",value:function(){var t=document.createElement("h1");t.classList.add("title");var e=document.createElement("div");return e.classList.add("h5p-interactive-book-status-chapter"),e.appendChild(t),{wrapper:e,text:t}}},{key:"createToTopButton",value:function(){var t=this,e=document.createElement("div");e.classList.add("icon-up"),e.classList.add("navigation-button");var r=document.createElement("button");return r.classList.add("h5p-interactive-book-status-to-top"),r.classList.add("h5p-interactive-book-status-button"),r.classList.add("h5p-interactive-book-status-arrow"),r.setAttribute("aria-label",this.params.l10n.navigateToTop),r.addEventListener("click",(function(){t.parent.trigger("scrollToTop"),document.querySelector(".h5p-interactive-book-status-menu").focus()})),r.appendChild(e),r}},{key:"setVisibility",value:function(t){t?this.wrapper.classList.add("footer-hidden"):this.wrapper.classList.remove("footer-hidden")}},{key:"createProgressIndicator",value:function(){var t=document.createElement("span");t.classList.add("h5p-interactive-book-status-progress-number"),t.setAttribute("aria-hidden","true");var e=document.createElement("span");e.classList.add("h5p-interactive-book-status-progress-divider"),e.innerHTML=" / ",e.setAttribute("aria-hidden","true");var r=document.createElement("span");r.classList.add("h5p-interactive-book-status-progress-number"),r.innerHTML=this.totalChapters,r.setAttribute("aria-hidden","true");var n=document.createElement("p");n.classList.add("hidden-but-read");var a=document.createElement("p");a.classList.add("h5p-interactive-book-status-progress"),a.appendChild(t),a.appendChild(e),a.appendChild(r),a.appendChild(n);var o=document.createElement("div");return o.classList.add("h5p-interactive-book-status-progress-wrapper"),o.appendChild(a),{wrapper:o,current:t,total:r,divider:e,progressText:a,hiddenButRead:n}}},{key:"setButtonStatus",value:function(t,e){e?(this.arrows["buttonWrapper"+t].setAttribute("disabled","disabled"),this.arrows["button"+t].classList.add("disabled")):(this.arrows["buttonWrapper"+t].removeAttribute("disabled"),this.arrows["button"+t].classList.remove("disabled"))}},{key:"createFullScreenButton",value:function(){var t=this,e=function(){!0===H5P.isFullscreen?H5P.exitFullScreen():H5P.fullScreen(t.parent.mainWrapper,t.parent)},r=document.createElement("button");return r.classList.add("h5p-interactive-book-status-fullscreen"),r.classList.add("h5p-interactive-book-status-button"),r.classList.add("h5p-interactive-book-enter-fullscreen"),r.setAttribute("title",this.params.l10n.fullscreen),r.setAttribute("aria-label",this.params.l10n.fullscreen),r.addEventListener("click",e),r.addEventListener("keyPress",(function(t){13!==t.which&&32!==t.which||(e(),t.preventDefault())})),this.parent.on("enterFullScreen",(function(){t.parent.isFullscreen=!0,r.classList.remove("h5p-interactive-book-enter-fullscreen"),r.classList.add("h5p-interactive-book-exit-fullscreen"),r.setAttribute("title",t.params.l10n.exitFullscreen),r.setAttribute("aria-label",t.params.l10n.exitFullScreen),t.parent.pageContent.updateFooter()})),this.parent.on("exitFullScreen",(function(){t.parent.isFullscreen=!1,r.classList.remove("h5p-interactive-book-exit-fullscreen"),r.classList.add("h5p-interactive-book-enter-fullscreen"),r.setAttribute("title",t.params.l10n.fullscreen),r.setAttribute("aria-label",t.params.l10n.fullscreen),t.parent.pageContent.updateFooter()})),r}}])&&d(e.prototype,r),n&&d(e,n),Object.defineProperty(e,"prototype",{writable:!1}),o}();function g(t){return g="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},g(t)}function y(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function k(t,e){return k=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},k(t,e)}function w(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var r,n=C(t);if(e){var a=C(this).constructor;r=Reflect.construct(n,arguments,a)}else r=n.apply(this,arguments);return function(t,e){if(e&&("object"===g(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t)}(this,r)}}function C(t){return C=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},C(t)}const S=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&k(t,e)}(o,H5P.EventDispatcher);var e,r,n,a=w(o);function o(t,e,r,n,i){var s;return function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,o),(s=a.call(this)).parent=i,s.params=t,s.contentId=n,s.container=s.createContainer(),t.coverMedium?(s.visuals=s.createVisualsElement(t.coverMedium),s.visuals&&s.container.appendChild(s.visuals)):s.container.classList.add("h5p-cover-nographics"),s.container.appendChild(s.createTitleElement(e)),t.coverDescription&&s.container.appendChild(s.createDescriptionElement(t.coverDescription)),s.container.appendChild(s.createReadButton(r)),s}return e=o,(r=[{key:"createContainer",value:function(){var t=document.createElement("div");return t.classList.add("h5p-interactive-book-cover"),t}},{key:"createVisualsElement",value:function(t){if(!t||!t.params)return null;var e=document.createElement("div");return e.classList.add("h5p-interactive-book-cover-graphics"),e}},{key:"initMedia",value:function(){if(this.visuals&&this.params.coverMedium){var t=this.params.coverMedium;if("H5P.Video"===(t.library||"").split(" ")[0]&&(t.params.visuals.fit=!1),H5P.newRunnable(t,this.contentId,H5P.jQuery(this.visuals),!1,{metadata:t.medatata}),"H5P.Image"===(t.library||"").split(" ")[0]){var e=this.visuals.querySelector("img")||this.visuals.querySelector(".h5p-placeholder");e.style.height="auto",e.style.width="auto"}this.visuals.appendChild(this.createCoverBar())}}},{key:"createImage",value:function(t,e,r){var n=document.createElement("img");return n.classList.add("h5p-interactive-book-cover-image"),n.src=H5P.getPath(t,e),n.setAttribute("draggable","false"),r&&(n.alt=r),n}},{key:"createCoverBar",value:function(){var t=document.createElement("div");return t.classList.add("h5p-interactive-book-cover-bar"),t}},{key:"createTitleElement",value:function(t){var e=document.createElement("p");e.innerHTML=t;var r=document.createElement("div");return r.classList.add("h5p-interactive-book-cover-title"),r.appendChild(e),r}},{key:"createDescriptionElement",value:function(t){if(!t)return null;var e=document.createElement("div");return e.classList.add("h5p-interactive-book-cover-description"),e.innerHTML=t,e}},{key:"createReadButton",value:function(t){var e=this,r=document.createElement("button");r.innerHTML=t,r.onclick=function(){e.removeCover()};var n=document.createElement("div");return n.classList.add("h5p-interactive-book-cover-readbutton"),n.appendChild(r),n}},{key:"removeCover",value:function(){this.container.parentElement.classList.remove("covered"),this.container.parentElement.removeChild(this.container),this.hidden=!0,this.parent.trigger("coverRemoved")}}])&&y(e.prototype,r),n&&y(e,n),Object.defineProperty(e,"prototype",{writable:!1}),o}();r(7159);var x=r(7124),O=r.n(x);function E(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}var L=function(){function t(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t)}var e,r,n;return e=t,n=[{key:"setBase",value:function(e){e&&(t.colorBase=O()(e),t.colorText=[t.DEFAULT_COLOR_BG,t.computeContrastColor(t.colorBase),t.computeContrastColor(t.colorBase,t.DEFAULT_COLOR_BG)].map((function(e){return{color:e,contrast:t.colorBase.contrast(e)}})).reduce((function(t,e){return e.contrast>t.contrast?e:t}),{contrast:0}).color)}},{key:"getColor",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if("string"==typeof e.opacity&&/^([0-9]|[1-8][0-9]|9[0-9]|100)(\.\d+)?\s?%$/.test(e.opacity)&&(e.opacity=parseInt(e.opacity)/100),"number"!=typeof e.opacity||e.opacity<0||e.opacity>1)return t;var r=O()("#ffffff").rgb().array();return O().rgb(t.rgb().array().map((function(t,n){return e.opacity*t+(1-e.opacity)*r[n]})))}},{key:"isBaseColor",value:function(e){return O()(e).hex()===t.colorBase.hex()}},{key:"computeContrastColor",value:function(e,r){for(var n,a=(r=r||e).luminosity(),o=function(o){if((n=O().rgb(e.rgb().array().map((function(t){return t*(a>.5?1-o:1+o)})))).contrast(r)>=t.MINIMUM_ACCEPTABLE_CONTRAST)return"break"},i=0;i<=1&&"break"!==o(i);i+=.05);return n}},{key:"getContentTypeCSS",value:function(e){return t.COLOR_OVERRIDES[e]?t.COLOR_OVERRIDES[e].getCSS():""}},{key:"getCSS",value:function(){return":root{\n      --color-base: ".concat(t.colorBase,";\n      --color-base-5: ").concat(t.getColor(t.colorBase,{opacity:.05}),";\n      --color-base-10: ").concat(t.getColor(t.colorBase,{opacity:.1}),";\n      --color-base-20: ").concat(t.getColor(t.colorBase,{opacity:.2}),";\n      --color-base-75: ").concat(t.getColor(t.colorBase,{opacity:.75}),";\n      --color-base-80: ").concat(t.getColor(t.colorBase,{opacity:.8}),";\n      --color-base-85: ").concat(t.getColor(t.colorBase,{opacity:.85}),";\n      --color-base-90: ").concat(t.getColor(t.colorBase,{opacity:.9}),";\n      --color-base-95: ").concat(t.getColor(t.colorBase,{opacity:.95}),";\n      --color-text: ").concat(t.colorText,";\n      --color-contrast: ").concat(t.computeContrastColor(t.colorBase,t.DEFAULT_COLOR_BG),";\n    }")}}],(r=null)&&E(e.prototype,r),n&&E(e,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();function P(t){return P="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},P(t)}function A(t,e){var r="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=function(t,e){if(!t)return;if("string"==typeof t)return T(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);"Object"===r&&t.constructor&&(r=t.constructor.name);if("Map"===r||"Set"===r)return Array.from(t);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return T(t,e)}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,a=function(){};return{s:a,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:a}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var o,i=!0,s=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return i=t.done,t},e:function(t){s=!0,o=t},f:function(){try{i||null==r.return||r.return()}finally{if(s)throw o}}}}function T(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function j(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function I(t,e){return I=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},I(t,e)}function M(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var r,n=B(t);if(e){var a=B(this).constructor;r=Reflect.construct(n,arguments,a)}else r=n.apply(this,arguments);return function(t,e){if(e&&("object"===P(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t)}(this,r)}}function B(t){return B=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},B(t)}L.DEFAULT_COLOR_BASE=O()("#1768c4"),L.DEFAULT_COLOR_BG=O()("#ffffff"),L.MINIMUM_ACCEPTABLE_CONTRAST=4.5,L.colorBase=L.DEFAULT_COLOR_BASE,L.colorText=L.DEFAULT_COLOR_BG;const F=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&I(t,e)}(o,H5P.EventDispatcher);var e,r,n,a=M(o);function o(t,e,r){var n;return function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,o),(n=a.call(this)).parent=e,n.behaviour=t.behaviour,n.l10n=t.l10n,n.chapters=r||[],n.subContentId="summary",n.wrapper=null,n.summaryMenuButton=n.createSummaryButton(),n.filterActionAll="all",n.filterActionUnanswered="unanswered",n.bookCompleted=!1,n.tempState=JSON.stringify(n.parent.previousState&&n.parent.previousState.chapters?n.parent.previousState.chapters:n.getChapterStats()),e.on("bookCompleted",(function(t){return n.setBookComplete(t.data.completed)})),e.on("toggleMenu",(function(){var t=document.querySelector(".h5p-interactive-book-summary-footer");t&&n.bookCompleted&&(n.parent.isMenuOpen()?t.classList.add("menu-open"):t.classList.remove("menu-open"))})),n}return e=o,r=[{key:"setBookComplete",value:function(t){var e=this.parent.mainWrapper?this.parent.mainWrapper[0].querySelector(".h5p-interactive-book-summary-footer"):null;!e&&this.parent.isSmallSurface()&&((e=document.createElement("div")).classList.add("h5p-interactive-book-summary-footer"),e.appendChild(this.createSummaryButton()),this.parent.mainWrapper.append(e)),e&&t&&setTimeout((function(){return e.classList.add("show-footer")}),0),this.bookCompleted=t,Array.from(document.querySelectorAll(".h5p-interactive-book-summary-menu-button")).forEach((function(e){return e.setAttribute("data-book-completed",t.toString())}))}},{key:"setChapters",value:function(t){this.chapters=Array.isArray(t)?t:[]}},{key:"setSummaryMenuButtonDisabled",value:function(){var t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];this.summaryMenuButton.disabled=t}},{key:"setFilter",value:function(t){var e=this,r=this.wrapper.querySelector(".h5p-interactive-book-summary-overview-list"),n=Array.from(r.querySelectorAll(".h5p-interactive-book-summary-overview-section"));n.forEach((function(t){t.classList.remove("h5p-interactive-book-summary-top-section"),t.classList.remove("h5p-interactive-book-summary-bottom-section")}));var a=r.querySelector(".h5p-interactive-book-summary-overview-list-empty");if(a.style.display="none",t===this.filterActionUnanswered){r.classList.add("h5p-interactive-book-summary-overview-list-only-unanswered");var o=n.filter((function(t){return!t.classList.contains("h5p-interactive-book-summary-no-interactions")}));o.length?(o[0].classList.add("h5p-interactive-book-summary-top-section"),o[o.length-1].classList.add("h5p-interactive-book-summary-bottom-section")):a.style.display="block"}else t===this.filterActionAll&&r.classList.remove("h5p-interactive-book-summary-overview-list-only-unanswered");setTimeout((function(){return e.trigger("resize")}),1)}},{key:"createSummaryButton",value:function(){var t=this,e=document.createElement("button");e.classList.add("h5p-interactive-book-summary-menu-button"),e.onclick=function(){var e={h5pbookid:t.parent.contentId,chapter:"h5p-interactive-book-chapter-summary",section:"top"};t.parent.trigger("newChapter",e),t.parent.isMenuOpen()&&t.parent.isSmallSurface()&&t.parent.trigger("toggleMenu")};var r=document.createElement("span");r.classList.add("h5p-interactive-book-summary-icon"),r.classList.add("icon-paper"),r.setAttribute("aria-hidden","true");var n=document.createElement("span");n.classList.add("h5p-interactive-book-summary-text"),n.innerHTML=this.l10n.summaryAndSubmit;var a=document.createElement("span");return a.classList.add("h5p-interactive-book-summary-menu-button-arrow"),a.classList.add("icon-up"),a.setAttribute("aria-hidden","true"),e.appendChild(r),e.appendChild(n),e.appendChild(a),e}},{key:"createCircle",value:function(t){var e=L.computeContrastColor(L.colorBase,L.DEFAULT_COLOR_BG),r=document.createElement("div");return r.classList.add("h5p-interactive-book-summary-progress-circle"),r.setAttribute("data-value",t),r.setAttribute("data-start-angle",-Math.PI/3),r.setAttribute("data-thickness",13),r.setAttribute("data-empty-fill","rgba(".concat(e.rgb().array().join(", "),", .1)")),r.setAttribute("data-fill",JSON.stringify({color:e.hex()})),r}},{key:"createProgress",value:function(t,e,r,n){var a=arguments.length>4&&void 0!==arguments[4]&&arguments[4],o=arguments.length>5?arguments[5]:void 0,i=arguments.length>6?arguments[6]:void 0,s=document.createElement("div"),c=document.createElement("h3");c.innerHTML=t;var u=100*r/n;void 0===o&&(o=r),void 0===i&&(i=n);var l=document.createElement("p");if(l.classList.add("h5p-interactive-book-summary-progressbox-bigtext"),l.innerHTML=Math.round(u)+"%",a){var p=document.createElement("span");p.classList.add("absolute-value"),p.innerHTML=r;var h=document.createElement("span");h.classList.add("separator"),h.innerHTML="/";var d=document.createElement("span");d.classList.add("absolute-value"),d.innerHTML=n,l.innerHTML="",l.appendChild(p),l.appendChild(h),l.appendChild(d)}var f=document.createElement("span");f.classList.add("h5p-interactive-book-summary-progressbox-smalltext"),f.innerHTML=e.replace("@count",o).replace("@total",i),s.appendChild(c),s.appendChild(l),s.appendChild(f);var v=document.createElement("div");return v.appendChild(s),v.appendChild(this.createCircle(r/n)),v}},{key:"addScoreProgress",value:function(){var t,e=0,r=0,n=A(this.chapters);try{for(n.s();!(t=n.n()).done;){var a=t.value;e+=a.maxTasks,r+=a.tasksLeft}}catch(t){n.e(t)}finally{n.f()}var o=this.createProgress(this.l10n.totalScoreLabel,this.l10n.interactionsProgressSubtext,this.parent.getScore(),this.parent.getMaxScore(),!0,Math.max(e-r,0),e);o.classList.add("h5p-interactive-book-summary-progress-container"),o.classList.add("h5p-interactive-book-summary-score-progress");var i=o.querySelector(".h5p-interactive-book-summary-progress-circle");return i.setAttribute("data-empty-fill","rgb(198, 220, 212)"),i.setAttribute("data-fill",JSON.stringify({color:"#0e7c57"})),o}},{key:"addBookProgress",value:function(){var t=this.createProgress(this.l10n.bookProgress,this.l10n.bookProgressSubtext,this.chapters.filter((function(t){return t.completed})).length,this.chapters.length);return t.classList.add("h5p-interactive-book-summary-progress-container"),t.classList.add("h5p-interactive-book-summary-book-progress"),t}},{key:"addInteractionsProgress",value:function(){var t,e=0,r=0,n=A(this.chapters);try{for(n.s();!(t=n.n()).done;){var a=t.value;e+=a.maxTasks,r+=a.tasksLeft}}catch(t){n.e(t)}finally{n.f()}var o=this.createProgress(this.l10n.interactionsProgress,this.l10n.interactionsProgressSubtext,Math.max(e-r,0),e);return o.classList.add("h5p-interactive-book-summary-progress-container"),o.classList.add("h5p-interactive-book-summary-interactions-progress"),o}},{key:"addProgressIndicators",value:function(){if(this.behaviour.progressIndicators){var t=document.createElement("div");t.classList.add("h5p-interactive-box-summary-progress"),t.appendChild(this.addScoreProgress()),t.appendChild(this.addBookProgress()),t.appendChild(this.addInteractionsProgress()),setTimeout((function(){return H5P.jQuery(".h5p-interactive-book-summary-progress-circle").circleProgress()}),100),this.wrapper.appendChild(t)}}},{key:"addActionButtons",value:function(){var t=this,e=document.createElement("div");if(e.classList.add("h5p-interactive-book-summary-buttons"),this.checkTheAnswerIsUpdated(),this.parent.isSubmitButtonEnabled&&this.parent.isAnswerUpdated){var r=this.addButton("icon-paper-pencil",this.l10n.submitReport);r.classList.add("h5p-interactive-book-summary-submit"),r.onclick=function(){t.trigger("submitted"),t.parent.triggerXAPIScored(t.parent.getScore(),t.parent.getMaxScore(),"completed"),e.classList.add("submitted"),e.querySelector(".answers-submitted").focus(),t.tempState=JSON.stringify(t.getChapterStats()),t.parent.isAnswerUpdated=!1},e.appendChild(r)}this.behaviour.enableRetry&&e.appendChild(this.createRestartButton()),e.appendChild(this.createSubmittedConfirmation()),this.wrapper.appendChild(e)}},{key:"createRestartButton",value:function(){var t=this,e=this.addButton("icon-restart",this.l10n.restartLabel);return e.classList.add("h5p-interactive-book-summary-restart"),e.onclick=function(){return t.parent.resetTask()},e}},{key:"createSubmittedConfirmation",value:function(){var t=document.createElement("div");t.classList.add("h5p-interactive-book-summary-submitted");var e=document.createElement("span");e.classList.add("icon-chapter-done"),e.classList.add("icon-check-mark"),t.appendChild(e);var r=document.createElement("p");return r.innerHTML=this.l10n.yourAnswersAreSubmittedForReview,r.tabIndex=-1,r.classList.add("answers-submitted"),t.appendChild(r),this.behaviour.enableRetry&&t.appendChild(this.createRestartButton()),t}},{key:"addButton",value:function(t,e){var r=document.createElement("button");r.type="button",r.classList.add("h5p-interactive-book-summary-button"),r.innerHTML=e;var n=document.createElement("span");return n.classList.add(t),n.setAttribute("aria-hidden","true"),r.appendChild(n),r}},{key:"createSectionList",value:function(t,e){var r,n=this,a=[],o=!1,i=A(t);try{var s=function(){var t=r.value,i=document.createElement("li");if(i.classList.add("h5p-interactive-book-summary-overview-section-details"),n.behaviour.progressIndicators){var s=document.createElement("span");s.classList.add("h5p-interactive-book-summary-section-icon"),s.classList.add(t.taskDone?"icon-chapter-done":"icon-chapter-blank"),i.appendChild(s)}var c=document.createElement("button");c.type="button",c.classList.add("h5p-interactive-book-summary-section-title"),c.onclick=function(){var r={h5pbookid:n.parent.contentId,chapter:"h5p-interactive-book-chapter-".concat(e),section:"h5p-interactive-book-section-".concat(t.instance.subContentId)};n.parent.trigger("newChapter",r)};var u=t.instance.contentData&&t.instance.contentData.metadata&&t.instance.contentData.metadata.title,l=t.content&&t.content.metadata&&t.content.metadata.title;c.innerHTML=u||l||"Untitled";var p=document.createElement("div");p.classList.add("h5p-interactive-book-summary-section-score"),p.innerHTML="-","function"==typeof t.instance.getScore&&(p.innerHTML=n.l10n.scoreText.replace("@score",t.instance.getScore()).replace("@maxscore",t.instance.getMaxScore())),t.taskDone?i.classList.add("h5p-interactive-book-summary-overview-section-details-task-done"):o=!0,i.appendChild(c),i.appendChild(p),a.push(i)};for(i.s();!(r=i.n()).done;)s()}catch(t){i.e(t)}finally{i.f()}if(a.length){var c=document.createElement("div");c.classList.add("h5p-interactive-book-summary-overview-section-score-header");var u=document.createElement("div");u.innerHTML=this.l10n.score,c.appendChild(u),a.unshift(c)}return{hasUnansweredInteractions:o,sectionElements:a}}},{key:"createChapterOverview",value:function(t){var e=this,r=document.createElement("li");r.classList.add("h5p-interactive-book-summary-overview-section");var n=document.createElement("h4");n.onclick=function(){var r={h5pbookid:e.parent.contentId,chapter:"h5p-interactive-book-chapter-".concat(t.instance.subContentId),section:"top"};e.parent.trigger("newChapter",r)};var a=document.createElement("span");if(a.innerHTML=t.title,n.appendChild(a),this.behaviour.progressIndicators){var o=document.createElement("span"),i=this.parent.getChapterStatus(t);o.classList.add("icon-chapter-".concat(i.toLowerCase())),n.appendChild(o)}r.appendChild(n);var s=this.createSectionList(t.sections.filter((function(t){return t.isTask})),t.instance.subContentId),c=s.sectionElements;!1===s.hasUnansweredInteractions&&r.classList.add("h5p-interactive-book-summary-no-interactions");var u=document.createElement("div");u.classList.add("h5p-interactive-book-summary-chapter-subheader"),t.maxTasks?u.innerHTML=this.l10n.leftOutOfTotalCompleted.replace("@left",Math.max(t.maxTasks-t.tasksLeft,0)).replace("@max",t.maxTasks):u.innerHTML=this.l10n.noInteractions,r.appendChild(u);var l=document.createElement("ul");return c.length&&c.map((function(t){return l.appendChild(t)})),r.appendChild(l),r}},{key:"createFilterDropdown",value:function(){var t=this,e=function(e,o){var i=document.createElement("li");i.role="menuitem";var s=document.createElement("button");return s.textContent=e,s.type="button",s.onclick=function(e){t.setFilter(o),r.removeAttribute("active"),n.setAttribute("aria-expanded","false"),a.textContent=e.currentTarget.innerHTML},i.appendChild(s),i},r=document.createElement("div");r.classList.add("h5p-interactive-book-summary-dropdown");var n=document.createElement("button");n.setAttribute("aria-haspopup","true"),n.setAttribute("aria-expanded","false"),n.type="button",n.onclick=function(){r.hasAttribute("active")?(r.removeAttribute("active"),n.setAttribute("aria-expanded","false")):(r.setAttribute("active",""),n.setAttribute("aria-expanded","true"),n.focus())};var a=document.createElement("span");a.textContent=this.l10n.allInteractions,n.appendChild(a);var o=document.createElement("span");o.classList.add("h5p-interactive-book-summary-dropdown-icon"),o.classList.add("icon-expanded"),o.setAttribute("aria-hidden","true"),n.appendChild(o);var i=document.createElement("ul");i.role="menu",i.classList.add("h5p-interactive-book-summary-dropdown-menu");var s=e(this.l10n.allInteractions,this.filterActionAll),c=e(this.l10n.unansweredInteractions,this.filterActionUnanswered);return i.appendChild(s),i.appendChild(c),r.appendChild(n),r.appendChild(i),r}},{key:"addSummaryOverview",value:function(){var t=document.createElement("ul");t.classList.add("h5p-interactive-book-summary-list");var e=document.createElement("li");e.classList.add("h5p-interactive-book-summary-overview-header");var r=document.createElement("h3");r.innerHTML=this.l10n.summaryHeader,e.appendChild(r),e.appendChild(this.createFilterDropdown()),t.appendChild(e);var n=document.createElement("ol");n.classList.add("h5p-interactive-book-summary-overview-list");var a,o=A(this.chapters);try{for(o.s();!(a=o.n()).done;){var i=a.value;n.appendChild(this.createChapterOverview(i))}}catch(t){o.e(t)}finally{o.f()}var s=document.createElement("p");s.classList.add("h5p-interactive-book-summary-overview-list-empty"),s.classList.add("h5p-interactive-book-summary-top-section"),s.classList.add("h5p-interactive-book-summary-bottom-section"),s.innerHTML=this.l10n.noInteractions,n.appendChild(s),t.appendChild(n),this.wrapper.appendChild(t)}},{key:"addScoreBar",value:function(){var t=document.createElement("div");t.classList.add("h5p-interactive-book-summary-score-bar");var e=H5P.JoubelUI.createScoreBar(this.parent.getMaxScore());e.setScore(this.parent.getScore()),e.appendTo(t),this.wrapper.appendChild(t)}},{key:"noChapterInteractions",value:function(){var t=document.createElement("div");t.classList.add("h5p-interactive-book-summary-no-chapter-interactions");var e=document.createElement("p");e.innerHTML=this.l10n.noChapterInteractionBoldText;var r=document.createElement("p");r.classList.add("h5p-interactive-book-summary-no-initialized-chapters"),r.innerHTML=this.l10n.noChapterInteractionText,t.appendChild(e),t.appendChild(r),this.wrapper.appendChild(t)}},{key:"addSummaryPage",value:function(t){if(this.wrapper=document.createElement("div"),this.wrapper.classList.add("h5p-interactive-book-summary-page"),this.chapters.filter((function(t){return t.isInitialized})).length>0||this.chapters.some((function(t){return t.sections.some((function(t){return t.taskDone}))}))){if(this.parent.pageContent&&this.parent.chapters[this.parent.getChapterId(this.parent.pageContent.targetPage.chapter)].isSummary||0===this.parent.chapters.length){if(this.parent.chapters.length>0)for(var e in this.chapters)this.parent.pageContent.initializeChapter(e);this.addProgressIndicators(),this.addActionButtons(),this.addSummaryOverview(),this.addScoreBar()}}else this.noChapterInteractions();return Array.from(document.querySelectorAll(".h5p-interactive-book-summary-footer")).forEach((function(t){return t.remove()})),t.append(this.wrapper),t}},{key:"checkTheAnswerIsUpdated",value:function(){var t,e=this.getChapterStats(),r=JSON.parse(this.tempState),n=A(e.keys());try{for(n.s();!(t=n.n()).done;){var a,o=t.value,i=r[o].state.instances,s=e[o].state.instances,c=e[o].sections,u=A(i.keys());try{for(u.s();!(a=u.n()).done;){var l=a.value;null!==i[l]&&void 0!==i[l]&&(Array.isArray(i[l])&&!this.compareStates(i[l],s[l])&&c[l].taskDone&&(this.parent.isAnswerUpdated=!0),"object"===P(i[l])&&!Array.isArray(i[l])&&JSON.stringify(i[l])!==JSON.stringify(s[l])&&c[l].taskDone&&(this.parent.isAnswerUpdated=!0))}}catch(t){u.e(t)}finally{u.f()}if(this.parent.isAnswerUpdated)break}}catch(t){n.e(t)}finally{n.f()}}},{key:"getChapterStats",value:function(){return this.chapters.filter((function(t){return!t.isSummary})).map((function(t){return{sections:t.sections.map((function(t){return{taskDone:t.taskDone}})),state:t.instance.getCurrentState()}}))}},{key:"compareStates",value:function(t,e){return Array.isArray(t)&&Array.isArray(e)&&t.length===e.length&&t.every((function(t,r){return t===e[r]||""===e[r]}))}}],r&&j(e.prototype,r),n&&j(e,n),Object.defineProperty(e,"prototype",{writable:!1}),o}();function R(t){return R="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},R(t)}function N(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function D(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?N(Object(r),!0).forEach((function(e){H(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):N(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function H(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function _(){return _=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t},_.apply(this,arguments)}function z(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function q(t,e){return q=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},q(t,e)}function U(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var r,n=W(t);if(e){var a=W(this).constructor;r=Reflect.construct(n,arguments,a)}else r=n.apply(this,arguments);return function(t,e){if(e&&("object"===R(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t)}(this,r)}}function W(t){return W=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},W(t)}const V=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&q(t,e)}(i,H5P.EventDispatcher);var r,n,a,o=U(i);function i(t,e,r,n,a){var s;if(function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,i),(s=o.call(this)).parent=n,s.behaviour=t.behaviour,s.params=a,s.targetPage={},s.targetPage.redirectFromComponent=!1,s.columnNodes=[],s.chapters=[],s.l10n=t.l10n,s.sidebarIsOpen=!1,s.previousState=r.previousState&&Object.keys(r.previousState).length>0?r.previousState:null,n.hasValidChapters()){var c=s.createColumns(t,e,r);s.preloadChapter(c)}return s.content=s.createPageContent(),s.container=document.createElement("div"),s.container.classList.add("h5p-interactive-book-main","h5p-interactive-book-navigation-hidden"),s.container.appendChild(s.content),s}return r=i,n=[{key:"getChapters",value:function(){var t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];return this.chapters.filter((function(e){return!e.isSummary||e.isSummary&&!!t}))}},{key:"resetChapters",value:function(){this.behaviour.progressIndicators&&!this.behaviour.progressAuto&&this.columnNodes.forEach((function(t){Array.from(t.querySelectorAll(".h5p-interactive-book-status-progress-marker > input[type=checkbox]")).forEach((function(t){return t.checked=!1}))}))}},{key:"createPageContent",value:function(){var t=document.createElement("div");return t.classList.add("h5p-interactive-book-content"),this.columnNodes.forEach((function(e){t.appendChild(e)})),this.setChapterOrder(this.parent.getActiveChapter()),t}},{key:"setChapterOrder",value:function(t){t<0||t>this.columnNodes.length-1||this.columnNodes.forEach((function(e,r){e.classList.remove("h5p-interactive-book-previous"),e.classList.remove("h5p-interactive-book-current"),e.classList.remove("h5p-interactive-book-next"),r===t-1||r===t&&e.classList.add("h5p-interactive-book-current")}))}},{key:"createChapterReadCheckbox",value:function(t){var e=this,r=document.createElement("input");r.setAttribute("type","checkbox"),r.checked=t,r.onclick=function(t){e.parent.setChapterRead(void 0,t.target.checked)};var n=document.createElement("p");n.innerHTML=this.params.l10n.markAsFinished;var a=document.createElement("label");return a.classList.add("h5p-interactive-book-status-progress-marker"),a.appendChild(r),a.appendChild(n),a}},{key:"injectSectionId",value:function(t,e){for(var r=e.getElementsByClassName("h5p-column-content"),n=0;n<t.length;n++)r[n].id="h5p-interactive-book-section-".concat(t[n].instance.subContentId)}},{key:"preloadChapter",value:function(t){this.initializeChapter(t),this.initializeChapter(t+1)}},{key:"initializeChapter",value:function(t){if(!(t<0||t>this.chapters.length-1)){var e=this.chapters[t];if(e.isSummary){var r=this.columnNodes[t];return e.isInitialized&&(e.instance.setChapters(this.getChapters(!1)),r.innerHTML=""),e.instance.addSummaryPage(H5P.jQuery(r)),void(e.isInitialized=!0)}if(!e.isInitialized){var n,a,o=this.columnNodes[t];e.instance.attach(H5P.jQuery(o)),this.injectSectionId(e.sections,o),this.behaviour.progressIndicators&&!this.behaviour.progressAuto&&o.appendChild(this.createChapterReadCheckbox(!(null===(n=this.previousState)||void 0===n||null===(a=n.chapters)||void 0===a||!a[t].completed))),e.isInitialized=!0}}}},{key:"createColumns",value:function(t,r,n){var a=this,o=(n=_({},n)).previousState&&Object.keys(n.previousState).length>0?n.previousState:null,i=e.extractFragmentsFromURL(this.parent.validateFragments,this.parent.hashWindow);0===Object.keys(i).length&&n&&o&&o.urlFragments&&(i=o.urlFragments);var s=[];this.chapters=s;for(var c=function(e){var i=document.createElement("div"),c=D(D({},n),{},{metadata:D({},n.metadata),previousState:o?o.chapters[e].state:{}}),u=H5P.newRunnable(t.chapters[e],r,void 0,void 0,c);a.parent.bubbleUp(u,"resize",a.parent);var l={isInitialized:!1,instance:u,title:t.chapters[e].metadata.title,completed:!!o&&o.chapters[e].completed,tasksLeft:o?o.chapters[e].tasksLeft:0,isSummary:!1,sections:u.getInstances().map((function(r,n){return{content:t.chapters[e].params.content[n].content,instance:r,isTask:!1}}))};i.classList.add("h5p-interactive-book-chapter"),i.id="h5p-interactive-book-chapter-".concat(u.subContentId),l.maxTasks=0,l.tasksLeft=0,l.sections.forEach((function(t,r){H5P.Column.isTask(t.instance)&&(t.isTask=!0,l.maxTasks++,l.tasksLeft++,a.behaviour.progressIndicators&&(t.taskDone=!!o&&o.chapters[e].sections[r].taskDone,t.taskDone&&l.tasksLeft--))})),s.push(l),a.columnNodes.push(i)},u=0;u<t.chapters.length;u++)c(u);if(this.parent.hasSummary(s)){var l=document.createElement("div"),p=new F(D({},t),this.parent,this.getChapters(!1));this.parent.bubbleUp(p,"resize",this.parent);var h={isInitialized:!1,instance:p,title:this.l10n.summaryHeader,isSummary:!0,sections:[]};l.classList.add("h5p-interactive-book-chapter"),l.id="h5p-interactive-book-chapter-summary",h.maxTasks=h.tasksLeft,s.push(h),this.columnNodes.push(l)}if(i.chapter&&i.h5pbookid==this.parent.contentId){var d=this.findChapterIndex(i.chapter);if(-1===d)return 0;if(this.parent.setActiveChapter(d),i.section){var f=i.headerNumber;setTimeout((function(){a.redirectSection(i.section,f),a.parent.hasCover()&&a.parent.cover.removeCover()}),1e3)}return d}return 0}},{key:"redirectSection",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;if("top"===t)this.parent.trigger("scrollToTop");else{var r=document.getElementById(t);if(r){if(null!==e){var n=r.querySelectorAll("h2, h3");n[e]&&(r=n[e])}var a=document.createElement("div");a.setAttribute("tabindex","-1"),r.parentNode.insertBefore(a,r),a.focus(),a.addEventListener("blur",(function(){a.parentNode.removeChild(a)})),this.targetPage.redirectFromComponent=!1,setTimeout((function(){r.scrollIntoView(!0)}),100)}}}},{key:"findChapterIndex",value:function(t){var e=-1;return this.columnNodes.forEach((function(r,n){-1===e&&r.id===t&&(e=n)})),e}},{key:"changeChapter",value:function(t,e){var r=this;if(!this.columnNodes[this.parent.getActiveChapter()].classList.contains("h5p-interactive-book-animate")){this.targetPage=e;var n=this.parent.getActiveChapter(),a=this.parent.getChapterId(this.targetPage.chapter),o=n!==a;if(t||this.parent.updateChapterProgress(n,o),this.preloadChapter(a),a<this.columnNodes.length){var i=this.columnNodes[n],s=this.columnNodes[a];if(o&&!t){this.parent.setActiveChapter(a);var c=n<a?"next":"previous";s.classList.add("h5p-interactive-book-".concat(c)),s.classList.add("h5p-interactive-book-animate"),i.classList.add("h5p-interactive-book-animate"),setTimeout((function(){"previous"===c?i.classList.add("h5p-interactive-book-next"):(i.classList.remove("h5p-interactive-book-current"),i.classList.add("h5p-interactive-book-previous")),s.classList.remove("h5p-interactive-book-".concat(c))}),1),setTimeout((function(){i.classList.remove("h5p-interactive-book-next"),i.classList.remove("h5p-interactive-book-previous"),i.classList.remove("h5p-interactive-book-current"),s.classList.add("h5p-interactive-book-current"),s.classList.remove("h5p-interactive-book-animate"),i.classList.remove("h5p-interactive-book-animate"),r.redirectSection(r.targetPage.section,r.targetPage.headerNumber),r.parent.trigger("resize")}),250)}else this.parent.cover&&!this.parent.cover.hidden?this.parent.on("coverRemoved",(function(){r.redirectSection(r.targetPage.section,r.targetPage.headerNumber)})):this.redirectSection(this.targetPage.section,this.targetPage.headerNumber);this.parent.sideBar.redirectHandler(a)}}}},{key:"updateFooter",value:function(){if(0!==this.chapters.length){var t=this.parent.getActiveChapter(),e=this.columnNodes[t],r=this.parent.shouldFooterBeHidden(e.clientHeight),n=this.parent.statusBarFooter.wrapper.parentNode;r?n!==this.content&&this.content.appendChild(this.parent.statusBarFooter.wrapper):n!==this.parent.$wrapper&&this.parent.$wrapper.append(this.parent.statusBarFooter.wrapper)}}},{key:"toggleNavigationMenu",value:function(){var t=this;this.sidebarIsOpen?(H5P.Transition.onTransitionEnd(H5P.jQuery(this.container),(function(){t.container.classList.add("h5p-interactive-book-navigation-hidden")}),500),this.container.classList.remove("h5p-interactive-book-navigation-open")):(this.container.classList.remove("h5p-interactive-book-navigation-hidden"),setTimeout((function(){t.container.classList.add("h5p-interactive-book-navigation-open")}),1)),this.sidebarIsOpen=!this.sidebarIsOpen}}],n&&z(r.prototype,n),a&&z(r,a),Object.defineProperty(r,"prototype",{writable:!1}),i}();r(2062);function $(t){return $="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},$(t)}var G=["read","displayTOC","hideTOC","nextPage","previousPage","chapterCompleted","partCompleted","incompleteChapter","navigateToTop","markAsFinished","fullscreen","exitFullscreen","bookProgressSubtext","interactionsProgressSubtext","submitReport","restartLabel","summaryHeader","allInteractions","unansweredInteractions","scoreText","leftOutOfTotalCompleted","noInteractions","score","summaryAndSubmit","noChapterInteractionBoldText","noChapterInteractionText","yourAnswersAreSubmittedForReview","bookProgress","interactionsProgress","totalScoreLabel"];function X(t,e){if(null==t)return{};var r,n,a=function(t,e){if(null==t)return{};var r,n,a={},o=Object.keys(t);for(n=0;n<o.length;n++)r=o[n],e.indexOf(r)>=0||(a[r]=t[r]);return a}(t,e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);for(n=0;n<o.length;n++)r=o[n],e.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(t,r)&&(a[r]=t[r])}return a}function J(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function Y(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?J(Object(r),!0).forEach((function(e){K(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):J(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function K(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function Q(){return Q=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t},Q.apply(this,arguments)}function Z(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function tt(t,e){return tt=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},tt(t,e)}function et(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var r,n=nt(t);if(e){var a=nt(this).constructor;r=Reflect.construct(n,arguments,a)}else r=n.apply(this,arguments);return function(t,e){if(e&&("object"===$(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return rt(t)}(this,r)}}function rt(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function nt(t){return nt=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},nt(t)}var at=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&tt(t,e)}(i,H5P.EventDispatcher);var r,n,a,o=et(i);function i(t,r){var n,a,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,i);var c=rt(a=o.call(this));if(a.contentId=r,a.previousState=s.previousState,t&&t.behaviour&&t.behaviour.baseColor&&!L.isBaseColor(t.behaviour.baseColor)){L.setBase(t.behaviour.baseColor);var u=document.createElement("style");u.styleSheet?u.styleSheet.cssText=L.getCSS():u.appendChild(document.createTextNode(L.getCSS())),document.head.appendChild(u)}a.activeChapter=0,a.newHandler={},a.completed=!1,a.params=i.sanitizeConfig(t),a.l10n=a.params.l10n,a.params.behaviour=a.params.behaviour||{},a.mainWrapper=null,a.currentRatio=null,a.smallSurface="h5p-interactive-book-small",a.mediumSurface="h5p-interactive-book-medium",a.largeSurface="h5p-interactive-book-large",a.chapters=[],a.isSubmitButtonEnabled=!1,a.isAnswerUpdated=!0,void 0!==s.isScoringEnabled||void 0!==s.isReportingEnabled?a.isSubmitButtonEnabled=s.isScoringEnabled||s.isReportingEnabled:void 0!==H5PIntegration.reportingIsEnabled&&(a.isSubmitButtonEnabled=H5PIntegration.reportingIsEnabled),a.params.behaviour.enableSolutionsButton=!1,a.params.behaviour.enableRetry=null===(n=a.params.behaviour.enableRetry)||void 0===n||n,a.getAnswerGiven=function(){return a.chapters.reduce((function(t,e){return"function"==typeof e.instance.getAnswerGiven?t&&e.instance.getAnswerGiven():t}),!0)},a.getScore=function(){return a.chapters.length>0?a.chapters.reduce((function(t,e){return"function"==typeof e.instance.getScore?t+e.instance.getScore():t}),0):a.previousState&&a.previousState.score||0},a.getMaxScore=function(){return a.chapters.length>0?a.chapters.reduce((function(t,e){return"function"==typeof e.instance.getMaxScore?t+e.instance.getMaxScore():t}),0):a.previousState&&a.previousState.maxScore||0},a.showSolutions=function(){a.chapters.forEach((function(t){"function"==typeof t.instance.toggleReadSpeaker&&t.instance.toggleReadSpeaker(!0),"function"==typeof t.instance.showSolutions&&t.instance.showSolutions(),"function"==typeof t.instance.toggleReadSpeaker&&t.instance.toggleReadSpeaker(!1)}))},a.resetTask=function(){if(a.hasValidChapters()){for(var t in a.chapters.forEach((function(t,e){"function"==typeof t.instance.resetTask&&t.instance.resetTask(),t.completed=!1,t.tasksLeft=t.maxTasks,t.sections.forEach((function(t){return t.taskDone=!1})),a.setChapterRead(e,!1)})),a.previousState)delete a.previousState[t];a.hashWindow.location.hash="";var e=a.getActiveChapter();a.redirectChapter({h5pbookid:a.contentId,chapter:a.pageContent.columnNodes[0].id,section:"top"}),a.chapters[e].completed=!1,a.hasCover()&&a.displayCover(a.mainWrapper),a.isAnswerUpdated=!1,a.setActivityStarted(!0),a.pageContent.resetChapters(),a.sideBar.resetIndicators()}},a.getXAPIData=function(){var t=a.createXAPIEventTemplate("answered");return a.addQuestionToXAPI(t),t.setScoredResult(a.getScore(),a.getMaxScore(),rt(a),!0,a.getScore()===a.getMaxScore()),{statement:t.data.statement,children:a.getXAPIDataFromChildren(a.chapters.map((function(t){return t.instance})))}},a.getXAPIDataFromChildren=function(t){return t.map((function(t){if("function"==typeof t.getXAPIData)return t.getXAPIData()})).filter((function(t){return!!t}))},a.addQuestionToXAPI=function(t){Q(t.getVerifiedStatementValue(["object","definition"]),a.getxAPIDefinition())},a.getxAPIDefinition=function(){return{interactionType:"compound",type:"http://adlnet.gov/expapi/activities/cmi.interaction",description:{"en-US":""}}},a.getCurrentState=function(){var t,r=a.chapters.filter((function(t){return!t.isSummary})).map((function(t){return{completed:t.completed||null,sections:t.sections.map((function(t){return{taskDone:t.taskDone||null}})),state:t.instance.getCurrentState()||null}})),n={urlFragments:!a.hashWindow.location.hash&&null!==(t=a.previousState)&&void 0!==t&&t.urlFragments?a.previousState.urlFragments:e.extractFragmentsFromURL(a.validateFragments,a.hashWindow),chapters:r};return a.activeChapter>0&&(n.score=a.getScore(),n.maxScore=a.getMaxScore()),n},a.getContext=function(){return a.cover&&!a.cover.hidden?{}:{type:"page",value:a.activeChapter+1}},a.hasCover=function(){return a.cover&&a.cover.container},a.hasSummary=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:a.chapters;return a.hasChaptersTasks(t)&&a.params.behaviour.displaySummary&&!0===a.params.behaviour.displaySummary},a.hasChaptersTasks=function(t){return t.filter((function(t){return t.sections.filter((function(t){return!0===t.isTask})).length>0})).length>0},a.hasValidChapters=function(){return a.params.chapters.length>0},a.getActiveChapter=function(){return arguments.length>0&&void 0!==arguments[0]&&arguments[0]?a.chapters[a.activeChapter]:a.activeChapter},a.setActiveChapter=function(t){t=parseInt(t),isNaN(t)||(a.activeChapter=t)},a.validateFragments=function(t){return void 0!==t.chapter&&String(t.h5pbookid)===String(c.contentId)},a.bubbleUp=function(t,e,r){t.on(e,(function(t){r.bubblingUpwards=!0,r.trigger(e,t),r.bubblingUpwards=!1}))},a.isMenuOpen=function(){return a.statusBarHeader.isMenuOpen()},a.isSmallSurface=function(){return a.mainWrapper&&a.mainWrapper.hasClass(a.smallSurface)},a.getRatio=function(){return a.mainWrapper.width()/parseFloat(a.mainWrapper.css("font-size"))},a.setWrapperClassFromRatio=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:a.getRatio();e!==a.currentRatio&&(a.breakpoints().forEach((function(t){t.shouldAdd(e)?a.mainWrapper.addClass(t.className):a.mainWrapper.removeClass(t.className)})),a.currentRatio=e)},a.resize=function(){if(a.pageContent&&a.hasValidChapters()&&a.mainWrapper){a.setWrapperClassFromRatio(a.mainWrapper);var t=a.getActiveChapter(),e=a.pageContent.columnNodes[t];null!==e.offsetParent&&(a.bubblingUpwards||a.pageContent.chapters[t].instance.trigger("resize"),a.pageContent.content.style.height==="".concat(e.offsetHeight,"px")||e.classList.contains("h5p-interactive-book-animate")||(a.pageContent.content.style.height="".concat(e.offsetHeight,"px"),a.pageContent.updateFooter(),setTimeout((function(){a.trigger("resize")}),10)))}},a.on("resize",a.resize,rt(a)),a.on("toggleMenu",(function(t){var e;a.sideBar.container.addEventListener("transitionend",(function(){a.trigger("resize")}));var r=!(null!==(e=t.data)&&void 0!==e&&e.shouldNotFocusNav);a.pageContent.toggleNavigationMenu(),a.statusBarHeader.menuToggleButton.setAttribute("aria-expanded",a.statusBarHeader.menuToggleButton.classList.toggle("h5p-interactive-book-status-menu-active")?"true":"false"),a.pageContent.sidebarIsOpen&&r&&a.sideBar.focus()})),a.on("scrollToTop",(function(){if(!0===H5P.isFullscreen){var t=a.pageContent.container;t.scrollBy(0,-t.scrollHeight)}else a.statusBarHeader.wrapper.scrollIntoView(!0)})),a.on("newChapter",(function(t){if(!a.pageContent.columnNodes[a.getActiveChapter()].classList.contains("h5p-interactive-book-animate")){if(a.newHandler=t.data,t.data.newHash=e.createFragmentsString(a.newHandler),a.newHandler.redirectFromComponent=!0,a.getChapterId(t.data.chapter)===a.activeChapter)if(e.areFragmentsEqual(t.data,e.extractFragmentsFromURL(a.validateFragments,a.hashWindow),["h5pbookid","chapter","section","headerNumber"]))return void a.pageContent.changeChapter(!1,t.data);if(a.params.behaviour.progressAuto){var r=a.getChapterId(a.newHandler.chapter);a.isFinalChapterWithoutTask(r)&&a.setChapterRead(r)}H5P.trigger(rt(a),"changeHash",t.data),H5P.trigger(rt(a),"scrollToTop")}})),a.isCurrentChapterRead=function(){return a.isChapterRead(a.chapters[a.activeChapter],a.params.behaviour.progressAuto)},a.isChapterRead=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:a.params.behaviour.progressAuto;return t.completed||e&&0===t.tasksLeft},a.isFinalChapterWithoutTask=function(t){return 0===a.chapters[t].maxTasks&&a.chapters.slice(0,t).concat(a.chapters.slice(t+1)).every((function(t){return 0===t.tasksLeft}))},a.setChapterRead=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:a.activeChapter,e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];a.handleChapterCompletion(t,e),a.sideBar.updateChapterProgressIndicator(t,e?"DONE":a.hasChapterStartedTasks(a.chapters[t])?"STARTED":"BLANK")},a.hasChapterStartedTasks=function(t){return t.sections.filter((function(t){return t.taskDone})).length>0},a.getChapterStatus=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:a.params.behaviour.progressAuto,r="BLANK";return a.isChapterRead(t,e)?r="DONE":a.hasChapterStartedTasks(t)&&(r="STARTED"),r},a.updateChapterProgress=function(t){var e=arguments.length>1&&void 0!==arguments[1]&&arguments[1];if(a.params.behaviour.progressIndicators){var r,n=a.chapters[t];"DONE"===(r=n.maxTasks?a.getChapterStatus(n):a.isChapterRead(n)&&e?"DONE":"BLANK")&&a.handleChapterCompletion(t),a.sideBar.updateChapterProgressIndicator(t,r)}},a.getChapterId=function(t){t=t.replace("h5p-interactive-book-chapter-","");var e=a.chapters.map((function(t){return t.instance.subContentId})).indexOf(t);return-1===e?0:e},a.handleChapterCompletion=function(t){var e=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],r=a.chapters[t];if(!0!==r.isSummary){if(!e)return r.completed=!1,a.completed=!1,void a.trigger("bookCompleted",{completed:a.completed});r.completed||(r.completed=!0,r.instance.triggerXAPIScored(r.instance.getScore(),r.instance.getMaxScore(),"completed")),!a.completed&&a.chapters.filter((function(t){return!t.isSummary})).every((function(t){return t.completed}))&&(a.completed=!0,a.trigger("bookCompleted",{completed:a.completed}))}},a.shouldFooterBeHidden=function(){return a.isFullscreen},a.getContainerWidth=function(){return a.pageContent&&a.pageContent.container?a.pageContent.container.offsetWidth:0},a.changeChapter=function(t){a.pageContent.changeChapter(t,a.newHandler),a.statusBarHeader.updateStatusBar(),a.statusBarFooter.updateStatusBar(),a.newHandler.redirectFromComponent=!1},a.breakpoints=function(){return[{className:a.smallSurface,shouldAdd:function(t){return t<43}},{className:a.mediumSurface,shouldAdd:function(t){return t>=43&&t<60}},{className:a.largeSurface,shouldAdd:function(t){return t>=60}}]},H5P.on(rt(a),"respondChangeHash",(function(){var t=e.extractFragmentsFromURL(c.validateFragments,a.hashWindow);t.h5pbookid&&String(t.h5pbookid)===String(c.contentId)&&a.redirectChapter(t)})),H5P.on(rt(a),"changeHash",(function(t){String(t.data.h5pbookid)===String(a.contentId)&&(a.hashWindow.location.hash=t.data.newHash)})),H5P.externalDispatcher.on("xAPI",(function(t){var e=["answered","completed","interacted","attempted"].indexOf(t.getVerb())>-1,r=c.chapters.length;if(c!==this&&e&&r){var n,a=this.subContentId||(null===(n=this.contentData)||void 0===n?void 0:n.subContentId);if(!a)return;c.setSectionStatusByID(a,c.activeChapter)}})),a.redirectChapter=function(t){a.newHandler.redirectFromComponent||(t.h5pbookid&&String(t.h5pbookid)===String(c.contentId)?c.newHandler=t:c.newHandler={chapter:"h5p-interactive-book-chapter-".concat(c.chapters[0].instance.subContentId),h5pbookid:c.h5pbookid}),c.changeChapter(!1)},a.setSectionStatusByID=function(t,e){a.chapters[e].sections.forEach((function(r,n){var o=r.instance;o.subContentId!==t||r.taskDone||(r.taskDone=!o.getAnswerGiven||o.getAnswerGiven(),a.sideBar.setSectionMarker(e,n),r.taskDone&&(a.chapters[e].tasksLeft-=1),a.updateChapterProgress(e))}))},a.addHashListener=function(t){t.addEventListener("hashchange",(function(t){H5P.trigger(rt(a),"respondChangeHash",t)})),a.hashWindow=t};try{a.addHashListener(top)}catch(t){if(!(t instanceof DOMException))throw t;a.addHashListener(window)}a.displayCover=function(t){a.hideAllElements(!0),t.append(a.cover.container),t.addClass("covered"),a.cover.initMedia()},a.attach=function(t){a.mainWrapper=t,t.addClass("h5p-interactive-book h5p-scrollable-fullscreen"),a.isEdge18orEarlier()&&t.addClass("edge-18"),a.setWrapperClassFromRatio(a.mainWrapper),a.cover&&a.displayCover(t),t.append(a.statusBarHeader.wrapper);var e=a.pageContent.container.firstChild;e&&a.pageContent.container.insertBefore(a.sideBar.container,e),t.append(a.pageContent.container),t.append(a.statusBarFooter.wrapper),a.$wrapper=t,a.params.behaviour.defaultTableOfContents&&!a.isSmallSurface()&&a.trigger("toggleMenu",{shouldNotFocusNav:!0}),a.pageContent.updateFooter()},a.isEdge18orEarlier=function(){var t=window.navigator.userAgent,e=t.indexOf("Edge/");if(e<0)return!1;var r=t.substring(e+5,t.indexOf(".",e));return parseInt(r)<=18},a.hideAllElements=function(t){var e=[this.statusBarHeader.wrapper,this.statusBarFooter.wrapper,this.pageContent.container];t?e.forEach((function(t){t.classList.add("h5p-content-hidden"),t.classList.add("h5p-interactive-book-cover-present")})):e.forEach((function(t){t.classList.remove("h5p-content-hidden"),t.classList.remove("h5p-interactive-book-cover-present")}))},a.params.showCoverPage&&(a.cover=new S(a.params.bookCover,s.metadata.title,a.l10n.read,r,rt(a)));var p=Y(Y({},s),{},{parent:rt(a)});return a.pageContent=new V(a.params,r,p,rt(a),{l10n:{markAsFinished:a.l10n.markAsFinished},behaviour:a.params.behaviour}),a.chapters=a.pageContent.getChapters(),a.sideBar=new l(a.params,r,s.metadata.title,rt(a)),a.chapters.forEach((function(t,e){a.setChapterRead(e,t.completed)})),a.statusBarHeader=new b(r,a.chapters.length,rt(a),{l10n:a.l10n,a11y:a.params.a11y,behaviour:a.params.behaviour,displayFullScreenButton:!0,displayMenuToggleButton:!0},"h5p-interactive-book-status-header"),a.statusBarFooter=new b(r,a.chapters.length,rt(a),{l10n:a.l10n,a11y:a.params.a11y,behaviour:a.params.behaviour,displayToTopButton:!0},"h5p-interactive-book-status-footer"),a.hasCover()?(a.hideAllElements(!0),a.on("coverRemoved",(function(){a.hideAllElements(!1),a.trigger("resize"),a.setActivityStarted(),a.statusBarHeader.progressBar.progress.focus()}))):a.setActivityStarted(),a.hasValidChapters()&&(a.statusBarHeader.updateStatusBar(),a.statusBarFooter.updateStatusBar()),a}return r=i,a=[{key:"sanitizeConfig",value:function(t){var e=t.read,r=void 0===e?"Read":e,n=t.displayTOC,a=void 0===n?"Display &#039;Table of contents&#039;":n,o=t.hideTOC,i=void 0===o?"Hide &#039;Table of contents&#039;":o,s=t.nextPage,c=void 0===s?"Next page":s,u=t.previousPage,l=void 0===u?"Previous page":u,p=t.chapterCompleted,h=void 0===p?"Page completed!":p,d=t.partCompleted,f=void 0===d?"@pages of @total completed":d,v=t.incompleteChapter,m=void 0===v?"Incomplete page":v,b=t.navigateToTop,g=void 0===b?"Navigate to the top":b,y=t.markAsFinished,k=void 0===y?"I have finished this page":y,w=t.fullscreen,C=void 0===w?"Fullscreen":w,S=t.exitFullscreen,x=void 0===S?"Exit fullscreen":S,O=t.bookProgressSubtext,E=void 0===O?"@count of @total pages":O,L=t.interactionsProgressSubtext,P=void 0===L?"@count of @total interactions":L,A=t.submitReport,T=void 0===A?"Submit Report":A,j=t.restartLabel,I=void 0===j?"Restart":j,M=t.summaryHeader,B=void 0===M?"Summary":M,F=t.allInteractions,R=void 0===F?"All interactions":F,N=t.unansweredInteractions,D=void 0===N?"Unanswered interactions":N,H=t.scoreText,_=void 0===H?"@score / @maxscore":H,z=t.leftOutOfTotalCompleted,q=void 0===z?"@left of @max interactinos completed":z,U=t.noInteractions,W=void 0===U?"No interactions":U,V=t.score,$=void 0===V?"Score":V,J=t.summaryAndSubmit,Y=void 0===J?"Summary & submit":J,K=t.noChapterInteractionBoldText,Q=void 0===K?"You have not interacted with any pages.":K,Z=t.noChapterInteractionText,tt=void 0===Z?"You have to interact with at least one page before you can see the summary.":Z,et=t.yourAnswersAreSubmittedForReview,rt=void 0===et?"Your answers are submitted for review!":et,nt=t.bookProgress,at=void 0===nt?"Book progress":nt,ot=t.interactionsProgress,it=void 0===ot?"Interactions progress":ot,st=t.totalScoreLabel,ct=void 0===st?"Total score":st,ut=X(t,G);return ut.chapters=ut.chapters.map((function(t){return t.params.content=t.params.content.filter((function(t){return t.content})),t})).filter((function(t){return t.params.content&&t.params.content.length>0})),ut.behaviour.displaySummary=void 0===ut.behaviour.displaySummary||ut.behaviour.displaySummary,ut.l10n={read:r,displayTOC:a,hideTOC:i,nextPage:c,previousPage:l,chapterCompleted:h,partCompleted:f,incompleteChapter:m,navigateToTop:g,markAsFinished:k,fullscreen:C,exitFullscreen:x,bookProgressSubtext:E,interactionsProgressSubtext:P,submitReport:T,restartLabel:I,summaryHeader:B,allInteractions:R,unansweredInteractions:D,scoreText:_,leftOutOfTotalCompleted:q,noInteractions:W,score:$,summaryAndSubmit:Y,noChapterInteractionBoldText:Q,noChapterInteractionText:tt,yourAnswersAreSubmittedForReview:rt,bookProgress:at,interactionsProgress:it,totalScoreLabel:ct},ut}}],(n=null)&&Z(r.prototype,n),a&&Z(r,a),Object.defineProperty(r,"prototype",{writable:!1}),i}();H5P=H5P||{},H5P.InteractiveBook=at})()})();;
