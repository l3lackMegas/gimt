window.addEventListener('keydown', function(evt) {
  if (evt.keyCode == 73 && evt.ctrlKey && evt.shiftKey) evt.preventDefault(); //Devloper Mode Ctrl + Shift + I
  if (evt.keyCode == 82 && evt.ctrlKey) evt.preventDefault(); //Force Reload Ctrl + R
  if (evt.keyCode == 122) evt.preventDefault(); //FullScreen F11
});

const fs = require('fs'),
      components = {
        frameSection: '<div class="frame-section"></div>',
        toolsDropPanel: '<div class="tools-drop-panel"><div class="areaAction"></div></div>'
      }

var _State = {},
    _U = {
      project: {
        namespace: "none",
        name: "No model select",
        title: "No model select",
        iterations: 0,
        order: {
          group: 0,
          dataset: 0
        },
        state: {
          lbGroupAll: true,
          groupSelected: 0,
          dsItemSelected: 0
        }
      }
    },
    _Log = [],
    isFrameOpen = false,
    isSecFrameOpen = false,
    isTDP = false,
    _StateTP = {
      projectPath: '',
      solutionFile: '',
      crrEditGroupState: {}
    };

var autoSaveState;

function loadFunction() {
  footerStatus('preparing', 'Loading State...');
  setTimeout(() => {
    getStateFilesData(getSiteGlobal('Site').startPath + '\\state.json', function(stateData) {
      _State = stateData;
        footerStatus('preparing', 'Loading GUI...');
      if(_State.lastOpen.length > 0) {
        setTimeout(() => {
          $('#app-contentArea').show();
          var argPathProject = '';
          if(fs.existsSync(remote.process.argv[1]) == true && remote.process.argv[1] != ".")
            argPathProject = remote.process.argv[1];
          else {
            var isPathRight = false,
            chFRCount = 0;
            try {
              while(isPathRight == false) {
                if(fs.existsSync(_State.projectsDetail[_State.lastOpen[chFRCount]].path)) {
                  argPathProject = _State.projectsDetail[_State.lastOpen[chFRCount]].path;
                  isPathRight = true;
                } else {
                  delete _State.projectsDetail[_State.lastOpen[chFRCount]];
                  delete _State.lastOpen[chFRCount];
                  saveProgramStateData()
                }
                chFRCount++;
              }
            } catch (error) {
              keepLog(error);
            }
          }

          _StateTP.solutionFile = argPathProject;
          _StateTP.projectPath = require('path').dirname(argPathProject);
          getStateFilesData(argPathProject, function(projectData) {
            dropModelOpen(projectData.project.namespace, null, function(data) {
              $('#tab-option-labelGroup .detailArea h3').html(findGroupStateSelected('id', data.project.state.groupSelected, ['name']));
              keepLog((() => (_U.project.state.groupSelected != 0))());
              loadComponent('./component/appFrame' ,'#app-frame', function() {
                footerStatus('available');
                loadEvents();
              });
            });
          }, function(e) {
            loadComponent('./component/appFrame' ,'#app-frame', function() {
              footerStatus('available');
              loadEvents();
            });
          });
        }, 250);
      } else {
        setTimeout(() => {
          $('#app-contentArea').show();
          loadComponent('./component/appFrame' ,'#app-frame', function() {
            footerStatus('available');
            loadEvents();
          });
        }, 250);
      }
      
    });
  }, 250);
  $('.overay').click(function(e) {
    closeAppFrame(e);
  });
}

function loadEvents() {
  appToolbars.enable('start-train');
  $( window ).resize(function() {
    if($("#pageDatasets").length > 0) {
      $('#image-grid-area').width(160 * Math.floor(($("#pageDatasets").width() / 160)));
    }
  });
}

function getStateFilesData(path, fn, finish) {
    var filename = path;
    fs.readFile(filename, 'utf8', function(err, data) {
      if (err) {
        wasumiMessage.openMsg(err, 'Ops! Something went wrong.', 'error', {
          option: ['okay'],
        });
        if(finish) finish(err);
        throw err;
      }
      if(fn) fn(JSON.parse(data));
    });
}

function writeStatesFilesData(path, value, fn) {
  var fs = require('fs');

  fs.writeFile(path, value, 'utf8', function(err, data) {
    if (err) throw err;
    if(fn) fn(path);
  });
}

function saveProgramStateData() {
  writeStatesFilesData(getSiteGlobal('Site').startPath + '\\state.json', JSON.stringify(_State, null, 2), function() {
    keepLog('State Saved!');
  });
}

function saveProjectData() {
  writeStatesFilesData(_StateTP.solutionFile, JSON.stringify(_U, null, 2), function() {
    keepLog('Project Save Saved!');
  });
}

function getRecent4Frame() {
  var finalFrameSet = [];
  $.each(_State.lastOpen, function( index, value ) {
      if(value != undefined && value != null && value != "undefined") {
          var states = {
              namespace: value,
              label: _State.projectsDetail[value].title,
              action: function(data) {
                  dropModelOpen(data.namespace);
              }
          }
          finalFrameSet.push(states);
      }
  });
  return finalFrameSet;
}

function footerStatus(mode, msg) {
  if($('body').hasClass('maximum'))
    $('body').attr('class', 'maximum');
  else
    $('body').attr('class', '');
  switch(mode) {
    case 'available' :
      if(!msg) msg = "Ready";
      $('body').addClass('available');
      $('#footer-txtStatus').html('<i class="fas fa-check-circle"></i> ' + msg);
      break;

    case 'training' :
      if(!msg) msg = "Training...";
      $('body').addClass('training');
      $('#footer-txtStatus').html('<i class="fas fa-circle-notch fa-spin"></i> ' + msg);
      break;

    case 'preparing' :
      if(!msg) msg = "Preparing...";
      $('#footer-txtStatus').html('<i class="fas fa-circle-notch fa-spin"></i> ' + msg);
  }
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
          $(id).html(elements);
        } else {
          $(id).html(found.html());
        }
        if(_State.hasOwnProperty('lasOpen') == true) saveProgramStateData();
        resetImgCropPositionControl()
        if(fn) fn(response);
      },
      error: function(jqXHR, exception) {
        setTimeout(function() {
          var msg = '';
          if (jqXHR.status === 0) {
              msg = '[' + jqXHR.status +'] Unknow error.\n' + JSON.stringify(jqXHR, null, 2);
          } else if (jqXHR.status == 404) {
              msg = '[' + jqXHR.status +'] Oparate not found.';
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
          wasumiMessage.openMsg(msg, 'Ops! Something went wrong.', 'error', {
            option: ['okay'],
          });
        }, 1500);
      }
    }); 
}

function appframeInit(data) {
  var coreObj = {},
      actionObj = {},
      ss = {},
      isDisable = {};
  $.each(data.menuTools, function( index, value ) {
    $(data.id).append('<button id="btn-app-frame-' + value.namespace + '" data="' + value.namespace + '">' + value.label + '</button>') ;
    if(value.subSection) $.each(value.subSection, function( index, ssValue ) {
      $.each(ssValue, function( index, gSsValue ) {
        if(gSsValue.isDisable)
          isDisable[gSsValue.namespace] = gSsValue.isDisable;
        else
          isDisable[gSsValue.namespace] == false;
        
        ss[gSsValue.namespace] = gSsValue;
        if(gSsValue.action) actionObj[gSsValue.namespace] = gSsValue;
        if(gSsValue.subSection) $.each(gSsValue.subSection, function( index, mSsValue ) {
          $.each(mSsValue, function( index, MgSsValue ) {
            if(MgSsValue.isDisable)
              isDisable[MgSsValue.namespace] = MgSsValue.isDisable;
            else
              isDisable[gSsValue.namespace] == false;
            if(MgSsValue.action) actionObj[MgSsValue.namespace] = MgSsValue;
          });
        });
      });
    });
    coreObj[value.namespace] = value;
  });
  $('#app-frame button').click(function(e) {
    if(isFrameOpen == false) {
      //if(isTDP == true) closeToolsDropPanel({skip: true});
      isFrameOpen = true;
      $('#app-frame button').removeClass('active');
      $(this).addClass('active');
      var cmpSec = $(components.frameSection);
      $.each(coreObj[$(this).attr('data')].subSection, function( index, subSectionVal ) {
        if(index > 0) cmpSec.append('<div class="line"></div>');
        $.each(subSectionVal, function( index, section ) {
          var disableClass = '',
              cmpSecHTML = '';
          if(isDisable[section.namespace]) disableClass = 'class="disable" ';
          cmpSecHTML = '<a id="frame-' + section.namespace + '"' + disableClass + 'onmouseover="subSectionAppFrame(\'' + section.namespace + '\', this)" onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '</a>';
          if(section.subSection) 
            cmpSecHTML = '<a id="frame-' + section.namespace + '"' + disableClass + 'onmouseover="subSectionAppFrame(\'' + section.namespace + '\', this)" onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '<span class="more-section">></span></a>';
          cmpSec.append(cmpSecHTML);
        });
      });
      cmpSec.css('left', e.target.offsetLeft + 'px');
      $('#app-contentArea').prepend(cmpSec[0].outerHTML);
      if($('#ov-Frame').length < 1) $('#app-contentArea').prepend('<div id="ov-Frame" class="overay" style="z-index: 900;" onclick="closeAppFrame(this)"></div>');
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
          var disableClass = '',
              cmpSecHTML = '';
          if(isDisable[section.namespace]) disableClass = 'class="disable" ';
          cmpSecHTML = '<a id="frame-' + section.namespace + '"' + disableClass + 'onmouseover="subSectionAppFrame(\'' + section.namespace + '\', this)" onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '</a>'
          if(section.subSection)
            cmpSecHTML = '<a id="frame-' + section.namespace + '"' + disableClass + 'onmouseover="subSectionAppFrame(\'' + section.namespace + '\', this)" onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '<span class="more-section">></span></a>'
          

            cmpSec.append(cmpSecHTML);
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
    ref: data,
    isDisable: isDisable,
    enable: function(namespace) {
      isDisable[namespace] = false;
      $('#frame-' + namespace).removeClass('disable');
    },
    disable: function(namespace) {
      isDisable[namespace] = true;
      $('#frame-' + namespace).addClass('disable');
    }
  };
}

function actionAppFrame(namespace) {
  if(!appToolbars.isDisable[namespace] && appToolbars.action[namespace]) {
    appToolbars.action[namespace].action(appToolbars.action[namespace]);
    closeAppFrame();
  }
}

function subSectionAppFrame(namespace, obj) {
  //appToolbars.action[namespace].action(appToolbars.action[namespace]);
  if(appToolbars.objCore[namespace].subSection) {
    if(appToolbars.objCore[namespace].subSection[0].length > 0) {
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
          var disableClass = ''
          if(appToolbars.isDisable[section.namespace]) disableClass = 'class="disable" ';
          cmpSec.append('<a id="frame-' + section.namespace + '"' + disableClass + 'onclick="actionAppFrame(\'' + section.namespace + '\')">' + section.label + '</a>');
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
    if($('#ov-Frame').length > 0) $('#ov-Frame').css('animation', 'fadeOut .25s forwards');
    if($('.frame-section').length > 0) $('.frame-section').css('animation', 'fadeOut .25s forwards');
    setTimeout(() => {
      if($('.frame-section').length > 0) $('.frame-section').remove();
      if($('#ov-Frame').length > 0) $('#ov-Frame').remove();
    }, 250);
  }
}

function setToolsDropPanel(event, obj) {
  if(isTDP == false) {
    showToolsDropPanel(event, obj);
  } else {
    if($(event).hasClass('active') == true)
      closeToolsDropPanel();
    else {
      $('.panel-tab-option').removeClass('active');
      $('.arrow-right .up').hide();
      $('.arrow-right .down').css('display', 'block');
      $('.tools-drop-panel').css('animation', 'none')
      $('.tools-drop-panel').fadeOut(150, function(e) {
        $(e).remove();
      });
      showToolsDropPanel(event, obj);
    }
  }
}

function showToolsDropPanel(event, obj) {
  isTDP = true;
  $(event).addClass('active');
  var cmpTDP = $(components.toolsDropPanel);
  cmpTDP.css({
    left: $(event)[0].offsetLeft + 'px',
    width: ($(event).width() + 22) + 'px'
  });
  $.each(obj, function( index, subSectionVal ) {
    var btnCategory = '';
    if(subSectionVal.button != undefined) btnCategory = '<button onclick="' + subSectionVal.button.fnName + '()">' + subSectionVal.button.name + '</button>';
    cmpTDP.prepend('<h4>' + subSectionVal.label + btnCategory + '</h4>');
    $.each(subSectionVal.projects, function( index, section ) {
      var icc = '';
      if(section.icon)
        icc = section.icon
      else if(subSectionVal.icon)
        icc = subSectionVal.icon

      var editBTN = '';
      if(subSectionVal.editFnName && section.noEdit != true) editBTN = '<button data="' + section.namespace + '" onclick="' + subSectionVal.editFnName + '(this)"><i class="fas fa-edit"></i></button>';

      if(section.namespace == subSectionVal.currentSelect)
        $('.areaAction', cmpTDP).append('<a class="active"><span onclick="' + subSectionVal.fnName + '(\'' + section.namespace + '\', this)">'+ icc + ' ' + section.label + '</span>' + editBTN + '</a>');
      else
        $('.areaAction', cmpTDP).append('<a><span onclick="' + subSectionVal.fnName + '(\'' + section.namespace + '\', this)">'+ icc + ' ' + section.label + '</span>' + editBTN + '</a>');
    });
  });
  if($('#ov-dropPanel').length < 1) $('#app-contentArea').prepend('<div id="ov-dropPanel" class="overay" style="top: 50px;"onclick="closeToolsDropPanel()"></div>');
  $('#app-contentArea').prepend(cmpTDP[0].outerHTML);
  $('.arrow-right .down', event).hide();
  $('.arrow-right .up', event).css('display', 'block');
}

function closeToolsDropPanel(obj) {
  if(isTDP == true && obj == undefined) {
    isTDP = false;
    $('.panel-tab-option').removeClass('active');
    if($('#ov-dropPanel').length > 0) $('#ov-dropPanel').css('animation', 'fadeOut .25s forwards');
    if($('.tools-drop-panel').length > 0) $('.tools-drop-panel').css('animation', 'fadeOut .25s forwards');
    setTimeout(() => {
      if($('.tools-drop-panel').length > 0) $('.tools-drop-panel').remove();
      if($('#ov-dropPanel').length > 0) $('#ov-dropPanel').remove();
    }, 250);
  } else if(isTDP == true && obj.skip == true){
    isTDP = false;
    $('.panel-tab-option').removeClass('active');
    if($('.tools-drop-panel').length > 0) $('.tools-drop-panel').remove();
    if($('#ov-dropPanel').length > 0) $('#ov-dropPanel').remove();
  }
  $('.arrow-right .up').hide();
  $('.arrow-right .down').css('display', 'block');
}

function toggleSideMenu() {
  if($('#side-menu').hasClass('active') == true) {
    $('#side-menu').removeClass('active');
    if($('#ov-sideMenu').length > 0) $('#ov-sideMenu').css('animation', 'fadeOut .25s forwards');
    setTimeout(() => {
      if($('#ov-sideMenu').length > 0) $('#ov-sideMenu').remove();
    }, 250);
  } else {
    if($('#ov-sideMenu').length < 1) $('#app-contentArea').prepend('<div id="ov-sideMenu" style="z-index: 700;" class="overay" onclick="toggleSideMenu()"></div>');
    $('#side-menu').addClass('active');
  }
}

var sideCrrPage = 'dashboard';
function sideMenuHandle(target, event) {
  if(target != sideCrrPage) {
    loadComponent('./page/' + target ,'#pageArea', function() {
      sideCrrPage = target;
      $('#side-menu .menu-area a').removeClass('active');
      if(event) {
        $(event).addClass('active');
        toggleSideMenu();
      } else {
        $('#side-menu .menu-area a[pg-navi="' + target + '"]').addClass('active');
      }
      if($("#pageDatasets").length < 1) $("#pageDatasets").off();
      if($("#pageCroping").length > 0 && event) setTimeout(() => {
        imgCropSelect(0);
      }, 50);
    });
  }
}

function showDialog(target) {
  loadComponent('./dialog/' + target, null, function(response) {
    $('#app-contentArea').css({
      transform: 'scale(0.975)'
    });
    $('#dialog').append(response);
    $('#modalBackdrop').show();
  });
}

function closeDialog() {
  $('#modalBackdrop .contain').css('animation', 'bounceOut .26s');
  $('#modalBackdrop').css('animation', 'fadeOut .5s');
  $('#app-contentArea').css({
    transform: ''
  });
  setTimeout(() => {
    $('#dialog').html('');
    $('#modalBackdrop').attr('style', '');
    $('#modalBackdrop .contain').attr('style', '');
    $('#modalBackdrop').css('animation', '');
  }, 250);
}

function addhttp(url) {
  if (!/^(f|ht)tps?:\/\//i.test(url)) {
     url = "http://" + url;
  }
  return url;
}

function fileUrl(str) {
  if (typeof str !== 'string') {
      throw new Error('Expected a string');
  }

  var pathName = path.resolve(str).replace(/\\/g, '/');

  // Windows drive letter must be prefixed with a slash
  if (pathName[0] !== '/') {
      pathName = '/' + pathName;
  }

  return encodeURI('file://' + pathName);
}

function converToNamespace(str) {
  if(str) {
    str = str.replace(/([&])+/g, 'and').toLowerCase();
    str = str.replace(/([\s.*+?^=%-@&!:${}()|\[\]\/\\+])+/g, '-').toLowerCase();
  } else str = ""
  return str;
}

function keepLog(objLog) {
  console.log(objLog);
  _Log.push(objLog);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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