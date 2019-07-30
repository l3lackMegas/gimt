var coreStatus = "ready"

function handleTraining(event) {
    switch(coreStatus) {
        case "ready" :
            appToolbars.disable('start-train');
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
                appToolbars.enable('stop-train');
            }, 2000);
            break;

        case "training" :
            appToolbars.disable('stop-train');
            coreStatus = "ready"
            $('h3', event).html('Start Train')
            $('p', event).html('with GPU')
            $('svg', event).remove();
            $(event).prepend('<i class="fas fa-play"></i>');
            appToolbars.enable('start-train');
            footerStatus('available');
            break;
    }
}

function optionModule(event) {
    var finalSet = getRecent4Frame();
    setToolsDropPanel(event, [
        {
            label: 'Model',
            fnName: 'dropModelOpen',
            icon: '<i class="fas fa-cubes"></i>',
            button: {
                name: 'Add',
                fnName: 'dropModelAdd'
            },
            editFnName: 'dropModelEdit',
            projects: finalSet,
            currentSelect: _State.lastOpen[0]
        }
    ]);
}

function dropModelAdd(event) {

}

function dropModelEdit(event) {

}

function dropModelOpen(namespace, event, fn) {
    $('.tools-drop-panel a').removeClass('active');
    if(event) $(event).addClass('active');
    var currentLOP = [namespace];
    $.each(_State.lastOpen, function( index, value ) {
        if(namespace != value) currentLOP.push(value);
    })
    _State.lastOpen = currentLOP;

    closeToolsDropPanel();
    _StateTP.projectPath = require('path').dirname(_State.projectsDetail[namespace].path);
    _StateTP.solutionFile = _State.projectsDetail[namespace].path;
    getStateFilesData(_State.projectsDetail[namespace].path, function(projectData) {
        _U = projectData;
        $('#tab-option-module h3').html(_U.project.title + " - " + _U.project.iterations + " Iterations");
        $('#tab-option-labelGroup .detailArea h3').html(findGroupStateSelected('id', _U.project.state.groupSelected, ['name']));
        try {
            appToolbars.objCore['open-recent'].subSection[0] = getRecent4Frame();
        } catch (error) {
            
        }
        loadComponent('./page/' + sideCrrPage ,'#pageArea', function() {
            if($("#pageCroping").length > 0) setTimeout(() => {
                imgCropSelect(0);
            }, 50);
            saveProgramStateData();
        });
        if(fn) fn(_U);
    }, function() { //Error
        if(!fs.existsSync(_State.projectsDetail[namespace].path)) {
            delete _State.projectsDetail[namespace];
            $.each(_State.lastOpen, function( index, value ) {
                if(value == namespace) delete _State.lastOpen[index];
            })
            saveProgramStateData();
          }
    });
}

function findGroupStateSelected(target, value, rtBack) {
    var rsGST = {},
        isFound = 0;
    $.each(_U.solution.group, function(index, groupState) {
        if(groupState[target] == value) {
            isFound = 1;
            if(!rtBack) {
                rsGST = groupState;
                rsGST['key'] = index;
            } else {
                if(rtBack.length == 1) {
                    if(rtBack[0] != "key") rsGST = groupState[rtBack[0]]; else rsGST = index;
                } else {
                    $.each(rtBack, function(minI, value) {
                        if(value != "key") rsGST[value] = groupState[value]; else rsGST['key'] = index;
                    });
                }
            }
            return false;
        }
    });
    if(isFound == 0) {
        var nonState = {
            id: 0,
            namespace: "none",
            name: "Others"
        }
        if(_U.project.state.lbGroupAll == true) nonState.name = "No group select";
        if(!rtBack)
            return nonState;
        else {
            if(rtBack.length == 1) {
                rsGST = nonState[rtBack[0]];
            } else {
                $.each(rtBack, function(index, value) {
                    rsGST[value] = nonState[target];
                });
            }
        }
    }
    return rsGST;
}

function optionGroup(event, isUpdate) {
    var finalSet = [
        {
            namespace: 'all',
            label: 'All',
            noEdit: true
        }
    ];
    $.each(_U.solution.group, function( index, value ) {
        var states = {
            namespace: value.namespace,
            label: value.name
        }
        finalSet.push(states);
    });
    var states = {
        namespace: 'none',
        label: 'Others',
        noEdit: true
    }
    finalSet.push(states);
    var crDSelect = 'all';
    if(_U.project.state.lbGroupAll == false) crDSelect = findGroupStateSelected('id', _U.project.state.groupSelected, ['namespace']);
    if(isUpdate == true) {
        $('.tools-drop-panel').remove();
        showToolsDropPanel(event, [
            {
                label: 'Group',
                fnName: 'dropGropOpen',
                icon: '<i class="far fa-object-ungroup"></i>',
                button: {
                    name: 'Add',
                    fnName: 'dropGroupAdd'
                },
                editFnName: 'dropGroupEdit',
                projects: finalSet,
                currentSelect: crDSelect
            }
        ]);
    } else {
        setToolsDropPanel(event, [
            {
                label: 'Group',
                fnName: 'dropGropOpen',
                icon: '<i class="far fa-object-ungroup"></i>',
                button: {
                    name: 'Add',
                    fnName: 'dropGroupAdd'
                },
                editFnName: 'dropGroupEdit',
                projects: finalSet,
                currentSelect: crDSelect
            }
        ]);
    }
    var tgScroll = 0;
    if(findGroupStateSelected('id', _U.project.state.groupSelected, ['id']) != 0)
        tgScroll = (27 * findGroupStateSelected('id', _U.project.state.groupSelected, ['id'])) - 127
    else if(findGroupStateSelected('id', _U.project.state.groupSelected, ['id']) == 0 && _U.project.state.lbGroupAll == true)
        tgScroll = 0;
    else
        tgScroll = (27 * _U.project.order.group) - 127;
    $(".tools-drop-panel .areaAction").animate({
        scrollTop: tgScroll
    }, 750);
}

function dropGroupAdd(event) {
    showDialog('addLabelGroup');
    setTimeout(() => {
        $('#lbGroupName').focus();
    }, 250);
}

async function dropGroupEdit(event) {
    if(event) _StateTP.crrEditGroupState = findGroupStateSelected('namespace', $(event).attr('data'), ['id', 'name', 'namespace']);
    else _StateTP.crrEditGroupState = findGroupStateSelected('id', _U.project.state.groupSelected, ['id', 'name', 'namespace']);
    await sleep(100);
    showDialog('editLabelGroup');
    setTimeout(() => {
        $('#lbGroupName').focus();
    }, 250);
}

function labelGroupOnchange () {
    $('#lbGroupNamespace').val(converToNamespace($('#lbGroupName').val()));
}

function addLabelGroup(event) {
    if($('#lbGroupNamespace').val() != "" && $('#lbGroupNamespace').val() != "none" && $('#lbGroupNamespace').val() != "all" && findGroupStateSelected('namespace', $('#lbGroupNamespace').val(), ['key']) == undefined) {
        $('#dialog .dialog-footer button[style="float: left;"]').hide();
        $('#modalBackdrop .contain dialog .dialog-footer button').prop('disabled', true);
        $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').html('<i class="fas fa-circle-notch fa-spin"></i><span>Adding label...</span>');
        $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').fadeIn(100);
        labelGroupOnchange();
        var setGroupState = {
            id: _U.project.order.group,
            namespace: $('#lbGroupNamespace').val(),
            name: $('#lbGroupName').val()
        };
        _U.project.order.group++;
        _U.solution.group.push(setGroupState);
        saveProjectData();
        setTimeout(() => {
            dropGropOpen(findGroupStateSelected('id', setGroupState.id, ['namespace']), null, true);
            optionGroup($('#tab-option-labelGroup')[0], true);
            closeDialog()
        }, 750);
    } else {
        $('#modalBackdrop .contain dialog .dialog-footer button').prop('disabled', false);
        $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').fadeOut(100);
    }
}

function editLabelGroup(event) {
    $('#dialog .dialog-footer button[style="float: left;"]').hide();
    $('#modalBackdrop .contain dialog .dialog-footer button').prop('disabled', true);
    $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').html('<i class="fas fa-circle-notch fa-spin"></i><span>Editing label...</span>');
    $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').fadeIn(100);
    labelGroupOnchange();
    if(($('#lbGroupNamespace').val() != "" && $('#lbGroupNamespace').val() != "none" && $('#lbGroupNamespace').val() != "all" && findGroupStateSelected('namespace', $('#lbGroupNamespace').val(), ['key']) == undefined) || $('#lbGroupNamespace').val() == _StateTP.crrEditGroupState.namespace) {
        var setGroupState = {
            id: _StateTP.crrEditGroupState.id,
            namespace: $('#lbGroupNamespace').val(),
            name: $('#lbGroupName').val()
        };
        _U.solution.group[findGroupStateSelected('namespace', _StateTP.crrEditGroupState.namespace, ['key'])] = setGroupState;
        saveProjectData();
        setTimeout(() => {
            dropGropOpen(findGroupStateSelected('id', setGroupState.id, ['namespace']), null, true);
            optionGroup($('#tab-option-labelGroup')[0], true);
            closeDialog()
        }, 750);
    } else {
        $('#modalBackdrop .contain dialog .dialog-footer button').prop('disabled', false);
        $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').fadeOut(100);
    }
}

function deleteLabelGroup(event) {
    var isConfirm = false;
    $('#dialog .dialog-footer button[style="float: left;"]').hide();
    $('#modalBackdrop .contain dialog .dialog-footer button').prop('disabled', true);
    $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').html('<i class="fas fa-circle-notch fa-spin"></i><span>Confirming action...</span>');
    $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').fadeIn(100);
    wasumiMessage.openMsg('The "' + findGroupStateSelected('namespace', _StateTP.crrEditGroupState.namespace, ['name']) + '" group will disappear forever.\nAre you sure you want to delete this Group?', 'Warning! please confirm your action.', 'warning', {
        addButton: [
            {namespace: 'delete', text: 'Delete'},
        ],
        option: ['delete', 'cancel'],
        fn: {
            delete: function() {
                isConfirm = true;
                $('#dialog .dialog-footer button[style="float: left;"]').hide();
                $('#modalBackdrop .contain dialog .dialog-footer button').prop('disabled', true);
                $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').html('<i class="fas fa-circle-notch fa-spin"></i><span>Deleting label...</span>');
                $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').fadeIn(100);
                var groupState = findGroupStateSelected('namespace', _StateTP.crrEditGroupState.namespace, ['id', 'key']);
                _U.solution.group[groupState.key] = null;
                var newGroupState = [],
                    newDatasetState = []
                $.each(_U.solution.group, function(index, obj) {
                    if(obj != null) newGroupState.push(obj);
                });
                _U.solution.group = newGroupState;

                $.each(_U.solution.dataset, function(index, obj) {
                    if(obj.groupID == groupState.id) {
                        obj.groupID = 0;
                    }
                    newDatasetState.push(obj);
                });
                _U.solution.dataset = newDatasetState;
                saveProjectData();
                setTimeout(() => {
                    if(_U.project.state.groupSelected == groupState.id) dropGropOpen('all', null, true);
                    optionGroup($('#tab-option-labelGroup')[0], true);
                    closeDialog()
                }, 500);
            }
        }
    }).afterClose(function() {
        setTimeout(() => {
            if(isConfirm == false) {
                $(event).fadeIn(100);
                $('#modalBackdrop .contain dialog .dialog-footer button').prop('disabled', false);
                $('#modalBackdrop .contain dialog .dialog-footer .loadingIcon').hide();
            }
        }, 50);
    })
}

function dropGropOpen(namespace, event, isNotCls) {
    var isSPName = '';
    if(findGroupStateSelected('id', _U.project.state.groupSelected, ['namespace']) == "none" && _U.project.state.lbGroupAll == true) {
        isSPName = 'all';
    } else if(findGroupStateSelected('id', _U.project.state.groupSelected, ['namespace']) == "none" && _U.project.state.lbGroupAll == false) {
        isSPName = 'none'
    }
    //console.log(namespace, findGroupStateSelected('id', _U.project.state.groupSelected, ['namespace']), namespace != findGroupStateSelected('id', _U.project.state.groupSelected, ['namespace']))
    //console.log((namespace != findGroupStateSelected('id', _U.project.state.groupSelected, ['namespace']) && namespace != "none" && namespace != "all"))
    if(namespace != findGroupStateSelected('id', _U.project.state.groupSelected, ['namespace']) && namespace != "none" && namespace != "all") {
        if(namespace == 'all') _U.project.state.lbGroupAll = true; else _U.project.state.lbGroupAll = false;
        _U.project.state.groupSelected = findGroupStateSelected('namespace', namespace, ['id']);
        $('#tab-option-labelGroup .detailArea h3').html(findGroupStateSelected('id', _U.project.state.groupSelected, ['name']));
        if(isNotCls != true) closeToolsDropPanel();
        saveProjectData();
        loadComponent('./page/' + sideCrrPage ,'#pageArea', function() {
            if($("#pageCroping").length > 0) setTimeout(() => {
                imgCropSelect(0);
            }, 50);
        });
    } else if (namespace != isSPName && (namespace == "none" || namespace == "all")) {
        if(namespace == 'all') _U.project.state.lbGroupAll = true; else _U.project.state.lbGroupAll = false;
        _U.project.state.groupSelected = findGroupStateSelected('namespace', namespace, ['id']);
        $('#tab-option-labelGroup .detailArea h3').html(findGroupStateSelected('id', _U.project.state.groupSelected, ['name']));
        if(isNotCls != true) closeToolsDropPanel();
        saveProjectData();
        loadComponent('./page/' + sideCrrPage ,'#pageArea', function() {
            if($("#pageCroping").length > 0) setTimeout(() => {
                imgCropSelect(0);
            }, 50);
        });
    }
    if(_U.project.state.groupSelected == 0) {
        appToolbars.disable('edit-label-group');
    } else {
        appToolbars.enable('edit-label-group');
    }
}

function getDatasets(tGroupID) {
    var output = [];
    if(tGroupID == undefined || _U.project.state.lbGroupAll == true) {
        $.each(_U.solution.dataset, function( index, value ) {
            if(value != undefined && value != null) {
                if(fs.existsSync(_StateTP.projectPath + "\\datasets\\" + value.filename)) {
                    output.push(value);
                } else {
                    delete _U.solution.dataset[index];
                    saveProjectData()
                }
            }
        });
    } else {
        $.each(_U.solution.dataset, function(index, datasetState) {
            if(datasetState.groupID == tGroupID) {
                if(datasetState != undefined && datasetState != null) {
                    if(fs.existsSync(_StateTP.projectPath + "\\datasets\\" + datasetState.filename)) {
                        output.push(datasetState);
                    } else {
                        delete _U.solution.dataset[index];
                        saveProjectData()
                    }
                }
            }
        });
    }
    return output;
}

ipcRenderer.on('SAVED_FILE', (event, path, obj) => {
    console.log("Saved file " + path);
    _U.solution.dataset.push(obj);
    saveProjectData();
    $('#image-grid-area').append('<div class="item-box" onclick="openImageCrop(\'' + (getDatasets(_U.project.state.groupSelected).length - 1) + '\');"><div class="img-pv" style="background-image: url(' + fileUrl(path) + ');"></div></div>')
})

function imgCropSelect(target) {
    $('#list-queue-image ul li').removeClass('active');
    $($('#list-queue-image ul li')[target]).addClass('active');
    resetImgCropPositionControl();
    $('#exampleIMG img')[0].src = fileUrl(_StateTP.projectPath + "\\datasets\\" + getDatasets(_U.project.state.groupSelected)[target].filename);
    $('#exampleIMG').css({
        width: getDatasets(_U.project.state.groupSelected)[target].size.width + 'px'
    });
    $("#list-queue-image ul").animate({
        scrollTop: (27 * target) - 126
    }, 250);
    //console.log($($('#list-queue-image ul li')[target])[0].offsetTop - 40)
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
        transform: 'translateY(' + imgCropExamPosition.top + '%) translateX(' + imgCropExamPosition.left + '%) scale(' + imgCropExamPosition.scale + ')',
        maxHeight: ''
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
            $('#imgPositionControl').scrollTop($('#imgPositionControl').scrollTop() + (($('#imgPositionControl')[0].scrollHeight / 100) * 25) / (imgCropExamPosition.scale));
            $('#imgPositionControl').scrollLeft($('#imgPositionControl').scrollLeft() + (($('#imgPositionControl')[0].scrollWidth / 100) * 25) / (imgCropExamPosition.scale))
            /*$('#imgPositionControl').stop().animate({
                scrollTop: ($('#imgPositionControl').scrollTop() + (($('#imgPositionControl')[0].scrollHeight / 100) * 25) / (imgCropExamPosition.scale)),
                scrollLeft: ($('#imgPositionControl').scrollLeft() + (($('#imgPositionControl')[0].scrollWidth / 100) * 25) / (imgCropExamPosition.scale))
            }, 200);*/
            if(imgCropExamPosition.scale >= 1) $('#exampleIMG').css('max-height', '');
                    
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
                $('#imgPositionControl').scrollTop($('#imgPositionControl').scrollTop() - (($('#imgPositionControl')[0].scrollHeight / 100) * 25) / (imgCropExamPosition.scale));
                $('#imgPositionControl').scrollLeft($('#imgPositionControl').scrollLeft() - (($('#imgPositionControl')[0].scrollWidth / 100) * 25) / (imgCropExamPosition.scale));
                /*$('#imgPositionControl').stop().animate({
                    scrollTop: ($('#imgPositionControl').scrollTop() - (($('#imgPositionControl')[0].scrollHeight / 100) * 25) / (imgCropExamPosition.scale)),
                    scrollLeft: ($('#imgPositionControl').scrollLeft() - (($('#imgPositionControl')[0].scrollWidth / 100) * 25) / (imgCropExamPosition.scale))
                }, 200);*/
                if(imgCropExamPosition.scale < 1) $('#exampleIMG').css('max-height', 'unset');
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