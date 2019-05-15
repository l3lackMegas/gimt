window.addEventListener('keydown', function(evt) {
  if (evt.keyCode == 73 && evt.ctrlKey && evt.shiftKey) evt.preventDefault(); //Devloper Mode Ctrl + Shift + I
  if (evt.keyCode == 82 && evt.ctrlKey) evt.preventDefault(); //Force Reload Ctrl + R
  if (evt.keyCode == 122) evt.preventDefault(); //FullScreen F11
});

const components = {
  frameSection: '<div class="frame-section"></div>'
}

var _U = {},
    _Log = [],
    UIComponent = {
      homeCardPost: '',
      pagePost: '',
      pagePostReply: ''
    },
    isFrameOpen = false,
    isSecFrameOpen = false;

function loadFunction() {
  
}

function loadComponent(urlPath ,id ,fn){
  urlPath = _componentOption.path + urlPath + _componentOption.ext;
    return new $.ajax({
      type: "GET",
      cache:false,
      url: urlPath,
      data: { },
      success: function(response){
        //var newTitle = $(response).filter('title').text();
        var elements = $(response);
        var found = $(elements).filter(id);
        keepLog('Ref.: "' + id + '", "' + urlPath + '" | Element "#' + $(response).attr('id') + ', .' + $(response).attr('class') + '": ' + found.length);
        if(found.length == 0) {
          $(id).append(elements);
        } else {
          $(id).append(found.html());
        }
        if(fn){fn();}
      },
      error: function(jqXHR, exception) {
        setTimeout(function() {
          var msg = '';
          if (jqXHR.status === 0) {
              msg = '[' + jqXHR.status +'] คอมพิวเตอร์ของคุณกำลังออฟไลน์อยู่';
          } else if (jqXHR.status == 404) {
              msg = '[' + jqXHR.status +'] ระบบไม่พบที่อยู่ของเซิร์ฟเวอร์ โปรดอัพเดตเวอร์ชั่น 48Gen';
          } else if (jqXHR.status == 500) {
              msg = '[' + jqXHR.status +'] เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';
          } else if (exception === 'parsererror') {
              msg = '[' + jqXHR.status +'] ร้องขอการวิเคราะห์ล้มเหลว';
          } else if (exception === 'timeout') {
              msg = '[' + jqXHR.status +'] หมดเวลาเชื่อมต่อ';
          } else if (exception === 'abort') {
              msg = '[' + jqXHR.status +'] การเชื่อมต่อถูกยกเลิก';
          } else {
              msg = 'เกิดข้อผิดพลาดที่ไม่คาดคิด.\n' + jqXHR.responseText;
          }
          //showError(true, "ไม่สามารถเชื่อมต่อกับ System Core !", msg)
        }, 1500);
      }
    }); 
}

function appframeInit(data) {
  var coreObj = {},
      actionObj = {},
      ss = {};
  $.each(data.menuTools, function( index, value ) {
    $(data.id).append('<button id="btn-app-frame-' + value.namespace + '" data="' + value.namespace + '">' + value.label + '</button>') ;
    if(value.subSection) $.each(value.subSection, function( index, ssValue ) {
      $.each(ssValue, function( index, gSsValue ) {
        ss[gSsValue.namespace] = gSsValue;
        if(gSsValue.action) actionObj[gSsValue.namespace] = gSsValue;
        if(gSsValue.subSection) $.each(gSsValue.subSection, function( index, mSsValue ) {
          $.each(mSsValue, function( index, MgSsValue ) {
            if(MgSsValue.action) actionObj[MgSsValue.namespace] = MgSsValue;
          });
        });
      });
    });
    coreObj[value.namespace] = value;
  });
  $('#app-frame button').click(function(e) {
    if(isFrameOpen == false) {
      isFrameOpen = true;
      $('#app-frame button').removeClass('active');
      $(this).addClass('active');
      var cmpSec = $(components.frameSection);
      $.each(coreObj[$(this).attr('data')].subSection, function( index, subSectionVal ) {
        if(index > 0) cmpSec.append('<div class="line"></div>');
        $.each(subSectionVal, function( index, section ) {
          if(section.subSection)
            cmpSec.append('<a onmouseover="subSectionAppFrame(\'' + section.namespace + '\', this)" onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '<span class="more-section">></span></a>');
          else
            cmpSec.append('<a onmouseover="subSectionAppFrame(\'' + section.namespace + '\', this)" onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '</a>');
        });
      });
      cmpSec.css('left', e.target.offsetLeft + 'px');
      $('#app-contentArea').prepend(cmpSec[0].outerHTML);
      if($('.overay').length < 1) $('#app-contentArea').prepend('<div class="overay" onclick="closeAppFrame(this)"></div>');
    } else {
      closeAppFrame();
    }
  });

  $('#app-frame button').hover(function(e) {
    if(isFrameOpen == true) {
      $('#app-frame button').removeClass('active');
      $(this).addClass('active');
      $('.frame-section').remove();
      var cmpSec = $(components.frameSection);
      $.each(coreObj[$(this).attr('data')].subSection, function( index, subSectionVal ) {
        if(index > 0) cmpSec.append('<div class="line"></div>');
        $.each(subSectionVal, function( index, section ) {
          if(section.subSection)
            cmpSec.append('<a onmouseover="subSectionAppFrame(\'' + section.namespace + '\', this)" onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '<span class="more-section">></span></a>');
          else
            cmpSec.append('<a onmouseover="subSectionAppFrame(\'' + section.namespace + '\', this)" onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '</a>');
        });
      });
      cmpSec.css('left', e.target.offsetLeft + 'px');
      $('#app-contentArea').prepend(cmpSec[0].outerHTML);
    }
  });

  
  return {
    core: coreObj,
    objCore: ss,
    action: actionObj,
    ref: data
  };
}

function actionAppFrame(namespace) {
  appToolbars.action[namespace].action(appToolbars.action[namespace]);
}

function subSectionAppFrame(namespace, obj) {
  //appToolbars.action[namespace].action(appToolbars.action[namespace]);
  if(appToolbars.objCore[namespace].subSection) {
    $('.frame-section a').removeClass('active');
    $(obj).addClass('active');
    $('.frame-section[sec-type="section"]').remove()
    var cmpSec = $(components.frameSection);
    cmpSec.attr('sec-type', 'section');
    if(isSecFrameOpen == false) cmpSec.css('animation', 'fadeIn .5s forwards');
    isSecFrameOpen = true;
    $.each(appToolbars.objCore[namespace].subSection, function( index, subSectionVal ) {
      if(index > 0) cmpSec.append('<div class="line"></div>');
      $.each(subSectionVal, function( index, section ) {
        cmpSec.append('<a onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '</a>');
      });
    });
    cmpSec.css({
      top: ($(obj).offset().top - 36) + 'px',
      left: ($(obj).offset().left + $(obj).width() + 20) + 'px'
    });
    $('#app-contentArea').append(cmpSec[0].outerHTML);
  } else {
    $('.frame-section a').removeClass('active');
    $('a[sec-type="section"]').remove()
    $('.frame-section[sec-type="section"]').remove()
    isSecFrameOpen = false;
  }
}

function closeAppFrame(obj) {
  if(isFrameOpen == true) {
    isFrameOpen = false;
    isSecFrameOpen = false;
    $('#app-frame button').removeClass('active');
    if($('.overay').length > 0) $('.overay').css('animation', 'fadeOut .25s forwards');
    if($('.frame-section').length > 0) $('.frame-section').css('animation', 'fadeOut .25s forwards');
    setTimeout(() => {
      if($('.frame-section').length > 0) $('.frame-section').remove();
      if($('.overay').length > 0) $('.overay').remove();
    }, 250);
  }
}

function addhttp(url) {
  if (!/^(f|ht)tps?:\/\//i.test(url)) {
     url = "http://" + url;
  }
  return url;
}

function keepLog(objLog) {
  console.log(objLog);
  _Log.push(objLog);
}

function randStr() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}