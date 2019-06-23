var coreStatus = "ready"

function handleTraining(event) {
    switch(coreStatus) {
        case "ready" :
            coreStatus = "preparinig"
            $(event).addClass('disable');
            $('h3', event).html('Starting train')
            $('p', event).html('processing...')
            $('svg', event).remove();
            $(event).prepend('<i class="fas fa-circle-notch fa-spin"></i>');
            footerStatus('preparing');
            setTimeout(() => {
                $('h3', event).html('Stop Training')
                $('p', event).html('process will stop.')
                $('svg', event).remove();
                $(event).prepend('<i class="fas fa-stop"></i>');
                footerStatus('training');
                coreStatus = "training"
                $(event).removeClass('disable');
            }, 2000);
            break;

        case "training" :
            coreStatus = "ready"
            $('h3', event).html('Start Train')
            $('p', event).html('with GPU')
            $('svg', event).remove();
            $(event).prepend('<i class="fas fa-play"></i>');
            footerStatus('available');
            break;
    }
}

function optionModule(event) {
    var finalSet = [];
    $.each(_State.lastOpen, function( index, value ) {
        var states = {
            namespace: value,
            label: _State.projectsDetail[value].title
        }
        finalSet.push(states);
    });
    setToolsDropPanel(event, [
        {
            label: 'Model',
            fnName: 'dropModelOpen',
            icon: '<i class="fas fa-cubes"></i>',
            projects: finalSet
        }
    ]);
}

function optionGroup(event) {
    var finalSet = [];
    $.each(_U.solution.label, function( index, value ) {
        var states = {
            namespace: value,
            label: value
        }
        finalSet.push(states);
    });
    setToolsDropPanel(event, [
        {
            label: 'Group',
            fnName: 'dropGropOpen',
            icon: '<i class="fas fa-cubes"></i>',
            projects: finalSet
        }
    ]);
}

function dropModelOpen(namespace, event) {
    $('.tools-drop-panel a').removeClass('active');
    if(event) $(event).addClass('active');
    var currentLOP = [namespace];
    $.each(_State.lastOpen, function( index, value ) {
        if(namespace != value) currentLOP.push(value);
    })
    _State.lastOpen = currentLOP;
    appToolbars.objCore['open-recent'].subSection[0] = getRecent4Frame();
    closeToolsDropPanel();
    _StateTP.projectPath = require('path').dirname(_State.projectsDetail[namespace].path);
    _StateTP.solutionFile = _State.projectsDetail[namespace].path;
    getStateFilesData(_State.projectsDetail[namespace].path, function(projectData) {
        _U = projectData;
        $('#tab-option-module h3').html(_U.project.title + " - " + _U.project.iterations + " Iterations");
        loadComponent('./page/' + sideCrrPage ,'#pageArea', function() {
            if($("#pageCroping").length > 0) setTimeout(() => {
                imgCropSelect(0);
            }, 50);
            saveProgramStateData();
        });
    });
}

function getDatasets() {
    var output = [];
    $.each(_U.solution.dataset, function( index, value ) {
        output.push(value);
    });
    return output;
}

ipcRenderer.on('SAVED_FILE', (event, path, obj) => {
    console.log("Saved file " + path);
    _U.solution.dataset.push(obj);
    saveProjectData();
    $('#image-grid-area').append('<div class="item-box" onclick="openImageCrop(\'' + (_U.solution.dataset.length - 1) + '\');"><div class="img-pv" style="background-image: url(' + fileUrl(path) + ');"></div></div>')
})

function imgCropSelect(target) {
    $('#list-queue-image ul li').removeClass('active');
    $($('#list-queue-image ul li')[target]).addClass('active');
    resetImgCropPositionControl();
    $('#exampleIMG').css({
        width: _U.solution.dataset[target].size.width + 'px',
        height:  _U.solution.dataset[target].size.height + 'px'
    });
    $("#list-queue-image ul").animate({
        scrollTop: (21 * target) - 126
    }, 250);
    console.log($($('#list-queue-image ul li')[target])[0].offsetTop - 40)
    $('#exampleIMG img')[0].src = fileUrl(_StateTP.projectPath + "\\datasets\\" + _U.solution.dataset[target].filename);
    $('#exampleIMG').attr('target', target)
}

function imgCropArrowsNavigate(cTarget) {
    switch(cTarget) {
        case "back":
            if((parseInt($('#exampleIMG').attr('target')) - 1) > (-1))
                imgCropSelect((parseInt($('#exampleIMG').attr('target')) - 1));
            break;
        
        case "next":
            if((parseInt($('#exampleIMG').attr('target')) + 1) < _U.solution.dataset.length)
                imgCropSelect((parseInt($('#exampleIMG').attr('target')) + 1));
            break;

    }
}

var imgCropExamPosition = {
    top: -50,
    left: -50,
    scale: 1
}

function resetImgCropPositionControl() {
    imgCropExamPosition = {
        top: -50,
        left: -50,
        scale: 1
    }
    $('#exampleIMG').css({
        top: '50%',
        left: '50%',
        transform: 'translateY(' + imgCropExamPosition.top + '%) translateX(' + imgCropExamPosition.left + '%) scale(' + imgCropExamPosition.scale + ')'
    })
}

function imgCropPositionControl(cTarget) {
    switch (cTarget) {
        case 'zoomIn':
            imgCropExamPosition.scale += 0.5;
            imgCropExamPosition.top += 26;

            if(($('#exampleIMG').width() * imgCropExamPosition.scale) > $('#imgPositionControl').width()) imgCropExamPosition.left += 25;
            if(imgCropExamPosition.scale <= 1) {
                imgCropExamPosition.top = -50;
                imgCropExamPosition.left = -50;
            }
            $('#exampleIMG').css({
                transform: 'translateY(' + imgCropExamPosition.top + '%) translateX(' + imgCropExamPosition.left + '%) scale(' + imgCropExamPosition.scale + ')'
            });
            $('#imgPositionControl').scrollTop();
            $('#imgPositionControl').stop().animate({
                scrollTop: ($('#imgPositionControl').scrollTop() + (($('#imgPositionControl')[0].scrollHeight / 100) * 25) / (imgCropExamPosition.scale)),
                scrollLeft: ($('#imgPositionControl').scrollLeft() + (($('#imgPositionControl')[0].scrollWidth / 100) * 25) / (imgCropExamPosition.scale))
            }, 200);
            break;

        case 'zoomOut':
            if(imgCropExamPosition.scale >= 1) {
                imgCropExamPosition.scale -= 0.5;
                imgCropExamPosition.top -= 26;
                if(imgCropExamPosition.scale <= 1) imgCropExamPosition.top = -50;

                if(($('#exampleIMG').width() * imgCropExamPosition.scale) > $('#imgPositionControl').width())
                    imgCropExamPosition.left -= 25;
                else 
                imgCropExamPosition.left = -50;
                $('#exampleIMG').css({
                    transform: 'translateY(' + imgCropExamPosition.top + '%) translateX(' + imgCropExamPosition.left + '%) scale(' + imgCropExamPosition.scale + ')'
                });
                $('#imgPositionControl').scrollTop();
                $('#imgPositionControl').stop().animate({
                    scrollTop: ($('#imgPositionControl').scrollTop() - (($('#imgPositionControl')[0].scrollHeight / 100) * 25) / (imgCropExamPosition.scale)),
                    scrollLeft: ($('#imgPositionControl').scrollLeft() - (($('#imgPositionControl')[0].scrollWidth / 100) * 25) / (imgCropExamPosition.scale))
                }, 200);
            }
            break;
    
        default:
            break;
    }
}

function openImageCrop(dsTarget) {
    sideMenuHandle('image-croping');
    setTimeout(() => {
        imgCropSelect(dsTarget);
    }, 50);
}