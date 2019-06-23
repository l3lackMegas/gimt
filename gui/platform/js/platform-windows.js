
const remote = require('electron').remote;
const shell = require('electron').shell;
const ipcRenderer  = require('electron').ipcRenderer;
const { exec } = require('child_process');
const path = require('path');
const _componentOption = {
  path: '',
  ext: '.html'
}

window.addEventListener('focus', function() {
  document.getElementById('app-titleBar').style.backgroundColor = "";
  $('body').css('border', '');
});

window.addEventListener('blur', function() {
  document.getElementById('app-titleBar').style.backgroundColor = "rgba(0,0,0,.0)";
  $('body').css('border', '1px #4d6063 solid');
  closeAppFrame();
});

function getSiteGlobal() {
    return remote.getGlobal('Site');
}

var updatePath = '',
    updateFile = '';

function checkVersion() {
  $.getJSON("https://app.48gen.com/getLastAppDetail", function(data) {
    console.log(data);
    if(remote.app.getVersion() == data.version) {
      if(require('fs').existsSync(remote.app.getPath('home') + "\\AppData\\Local\\Programs\\48gen\\update")) {
        require('rimraf')(remote.app.getPath('home') + "\\AppData\\Local\\Programs\\48gen\\update", function () {
          keepLog('Delete Update Path done.');
        });
      }
      loadSystem();
    } else {
      var filesSetupPath = remote.app.getPath('home') + "\\AppData\\Local\\Programs\\48gen\\update";
      if(require('fs').existsSync(filesSetupPath)) {
        wasumiMessage.openMsg('ขออภัย! การอัพเดตยังไม่เสร็จสมบูรณ์ คุณอาจต้องดำเนินการติดตั้งด้วยตัวเอง\nระบบตรวจพบไฟล์ติดตั้งล่าสุดอยู่ใน ' + filesSetupPath, 'คำเตือน!', 'warning', {
          addButton: [
            {namespace: 'openDirectPath', text: 'เปิดไฟล์ใน Explorer'},
            {namespace: 'openWebsite', text: 'ดาวน์โหลดจากเว็บไซต์'},
            {namespace: 'trySetupAgain', text: 'ลองอีกครั้ง'}
          ],
          option: ['trySetupAgain', 'openWebsite', 'openDirectPath'],
          fn: {
            trySetupAgain: function() {
              if(remote.getGlobal('Site').isDev == true) {
                wasumiMessage.openMsg('ขณะนี้ 48Gen มีเวอร์ชั่นใหม่มาแล้ว! ต้องการอัพเดตหรือไม่?\n(คุณกำลังอยู่ในโหมดนักพัฒนา การอัพเดตอาจปิดการทำงานในโหมดนี้)', 'ตรวจพบการอัพเดต!', 'warning', {
                  option: ['no', 'yes'],
                  fn: {
                    yes: function() {
                      require('rimraf')(remote.app.getPath('home') + "\\AppData\\Local\\Programs\\48gen\\update", function () {
                        keepLog('Delete Update Path done.');
                        updateNow(data, function() { $('#btn-msg-download').click(); });
                      });
                    },
                    no: function() {
                      loadSystem();
                    }
                  }
                }, 'default', {top: '0', height: '100%'}).afterClose(function() {
                  loadSystem();
                });
              } else {
                require('rimraf')(remote.app.getPath('home') + "\\AppData\\Local\\Programs\\48gen\\update", function () {
                  keepLog('Delete Update Path done.');
                  updateNow(data);
                });
              }
            },
            openWebsite: function() {
              shell.openExternal('https://app.48gen.com/download/windows');
              window.close();
            },
            openDirectPath: function() {
              shell.openItem(filesSetupPath);
              window.close();
            }
          }
        }, 'default', {top: '0', height: '100%'}).dialog();
      } else {
        if(remote.getGlobal('Site').isDev == true) {
          wasumiMessage.openMsg('ขณะนี้ 48Gen มีเวอร์ชั่นใหม่มาแล้ว! ต้องการอัพเดตหรือไม่?\n(คุณกำลังอยู่ในโหมดนักพัฒนา การอัพเดตอาจปิดการทำงานในโหมดนี้)', 'ตรวจพบการอัพเดต!', 'warning', {
            option: ['no', 'yes'],
            fn: {
              yes: function() {
                updateNow(data, function() { $('#btn-msg-download').click(); });
              },
              no: function() {
                loadSystem();
              }
            }
          }, 'default', {top: '0', height: '100%'}).afterClose(function() {
            loadSystem();
          });
        } else {
          updateNow(data);
        }
      }
    }
  });
  
}

function updateNow(data, fn) {
  $('#logoLoad .loadStatus').slideDown('fast');
      $('#logoLoad .loadStatus').html('กำลังเตรียมการอัพเดต..');
      updatePath = data.files.url;
      updateFile = data.files.name
      wasumiMessage.openMsg('โปรแกรมจะดาวน์โหลดไฟล์ชื่อ "' + data.files.name + '" มาในระบบ\nหากพบปัญหาในการติดตั้ง โปรดลองปิด AntiVirus แล้วดำเนินการต่อ\nต้องการดาวน์โหลดอัพเดตทันทีหรือไม่?\n(หากกดยกเลิก 48Gen จะปิดตัวลง)', 'ตรวจพบการอัพเดต!', 'warning', {
        addButton: [
          {namespace: 'download', text: 'ดาวน์โหลด'}
        ],
        option: ['cancel', 'download'],
        fn: {
          download: function() {
              ipcRenderer.send("download", {
                url: data.files.url,
                properties: {directory: "./update/"}
              });
          },
          cancel: function() {
            window.close();
          }
        }
      }, 'default', {top: '0', height: '100%'}).dialog();
      if(fn) fn();
}
      
ipcRenderer.on("download progress", (event, progress) => {
  var pNum = progress * 100;
  keepLog('Download update: ' + updatePath + ' | ' + pNum + '%'); // Progress in fraction, between 0 and 1
  $('#logoLoad .loadStatus').html('กำลังดาวน์โหลดอัพเดต... ' + Math.floor(pNum) + '%')
  const progressInPercentages = progress * 100; // With decimal point and a bunch of numbers
  const cleanProgressInPercentages = Math.floor(progress * 100); // Without decimal point
});

ipcRenderer.on("download complete", (event, file) => {
  $('#logoLoad .loadStatus').html('กำลังรอผู้ใช้ดำเนินการ');
  keepLog(remote.app.getPath('home') + "\\AppData\\Local\\Programs\\48gen\\" + file.replace(/[/]/g, "\\")); // Full file path
  //shell.openItem(remote.app.getPath('home') + "\\AppData\\Local\\Programs\\48gen\\" + file.replace(/[/]/g, "\\"))
  remote.getCurrentWindow().focus();
  wasumiMessage.openMsg('ระบบจะเปิดไฟล์ชื่อ "' + updateFile + '" ด้วยสิทธิ์ระดับ Adminstrator\nโปรดอนุญาตการทำงานดังกล่าวเพื่ออัพเดตโปรแกรม', 'โปรดทราบ!', 'warning', {
    addButton: [
      {namespace: 'open', text: 'เปิดอัพเดต'}
    ],
    option: ['open'],
    fn: {
      open: function() {
        exec('powershell -Command "Start-Process \'' +
        remote.app.getPath('home') + '\\AppData\\Local\\Programs\\48gen\\' + file.replace(/[/]/g, "\\") + '\' -Verb runAs"');
        window.close();
      }
    }
  }, 'default', {top: '0', height: '100%'}).dialog();
});


function changeBorderWindows() {
    try {
      if (remote.getCurrentWindow().isMaximized() == true) {
        if(!$('body').hasClass('maximum')) {
          $('body').addClass('maximum');
          $('#wasu-msg').css({
            top: ($('#wasu-msg').offset().top - 1) +'px'
          });
        }
      } else {
        if($('body').hasClass('maximum')) {
          $('body').removeClass('maximum');
          $('#wasu-msg').css({
            top: ($('#wasu-msg').offset().top + 1) + 'px'
          });
        }
      } 
    } catch (error) {
      
    }
  }

  (function () {

    $( window ).resize(function() {
      changeBorderWindows();
    });
  
    function init() {
      document.getElementById("btn-min").addEventListener("click", function (e) {
        const window = remote.getCurrentWindow();
        window.minimize();
      });
      
      document.getElementById("btn-max").addEventListener("click", function (e) {
        const window = remote.getCurrentWindow();
        if (!window.isMaximized()) {
          window.maximize();
        } else {
          window.unmaximize();
        }
        changeBorderWindows();
      });
        
        document.getElementById("btn-close").addEventListener("click", function (e) {
          const window = remote.getCurrentWindow();
          window.close();
        });
        
      };
      
      document.onreadystatechange = function () {
        if (document.readyState == "complete") {
          init();
        }
      };
  })();