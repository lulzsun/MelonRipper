// define global variables
var imageArray = [];
var isSaving = false;
var lastIndex = 0;
var pageTotal = 0;

// create an observer instance, in order to detect page changes
const observer = new MutationObserver(function(mutations) {
    savePages();
});

// the first function to run on page load
(function init() {
    var canvas = document.querySelector('canvas');
    var sliderLabel = document.querySelector('.slider-label');

    if(canvas && sliderLabel) { // wait for canvas to load
        // init imageArray length
        pageTotal = parseInt(sliderLabel.textContent.split('/')[1]);
        imageArray = Array.apply(null, Array(pageTotal)).map(function () {});

        savePages();

        observer.observe(sliderLabel, { childList: true });

    } else {
        setTimeout(init, 1000);
    }
})();


// get images from canvases that are in focus (visible to the reader) and save to global var
function savePages() {
    var flipsnap = document.querySelector('.flipsnap');
    var flipsnapX = parseInt(flipsnap.style.transform.match(/translate3d\((-?\d+)px/)[1], 10); // x translation of current view
    var sheets = document.querySelectorAll('.view-sheet-container');
    var pages = null;

    for(var i = 0; i < sheets.length; i++) {
        var sheetX = parseInt(sheets[i].style.transform.match(/translate3d\((-?\d+)px/)[1], 10); // x translation of sheet
        if(sheetX === -flipsnapX) { // find sheet under reader's current view
            pages = sheets[i].querySelectorAll('canvas');
            break;
        }
    }
    console.assert(pages !== null, "[MelonRipper] Sheet under reader's current view not found");

    var pageIndex = parseInt(document.querySelector('.slider-label').textContent.split('/')[0]) - 1;

    for(var j = 0; j < pages.length; j++) {
        var i = (window.wrappedJSObject.direction === 'LTR') ? j : (pages.length - 1 - j); // loop direction depends on reading direction

        //save image as base64
        imageArray[pageIndex] = pages[i].toDataURL().replace(/^data:image\/(png);base64,/, '');

        console.log(`[MelonRipper] Saved page ${pageIndex+1} of ${imageArray.length}`);
        pageIndex++;

        if((pageIndex % 10 == 0 && pageIndex != 0) || (pageIndex == pageTotal)) {
            saveToZip(lastIndex, pageIndex);
            lastIndex = pageIndex;
            imageArray = Array.apply(null, Array(pageTotal)).map(function () {});
        }
    }
}


// save all images to a zip using the JSZip lib
function saveToZip(start, end) {
    console.log('[MelonRipper] Preparing to zip files');

    var zip = new JSZip();
    for(var i = start; i < end; i++) {
        if(imageArray[i]) {
            console.log(`[MelonRipper] Packing image ${(i+1)} of ${imageArray.length}`);
            zip.file((i+1).toString().padStart(4, '0') + '.png', imageArray[i], {base64: true});
        } else {
            console.log(`[MelonRipper] Skipping image ${(i+1)} of ${imageArray.length}`);
        }
    }

    zip.generateAsync({type:'blob'}).then(function(content) {
        saveAs(content, 'melonbook.zip');
        console.log('[MelonRipper] Downloading zip of book');
        browser.runtime.sendMessage({
            command: 'send_Download',
            status: 'success'
        });
        isSaving = false;
    }, function (err) {
        console.error('[MelonRipper] Error occurred during creation of zip:', err);
        browser.runtime.sendMessage({
            command: 'send_Download',
            status: 'fail'
        });
        isSaving = false;
    });
}

// create message listener and listen to popup.js messages
browser.runtime.onMessage.addListener((message) => {
    if (message.command === 'ask_BookDetails') {
        // if popup.js asked for book details, lets prepare it and sent it to them
        browser.runtime.sendMessage({
            command: 'send_BookDetails',
            pages: imageArray,
            isSaving: isSaving,
        });
        console.log('[MelonRipper] Book details updated to popup!');
    } else if (message.command === 'ask_Download') {
        // if popup.js said asked for download, lets prepare it and sent them the status
        browser.runtime.sendMessage({
            command: 'send_Download',
            status: 'saving'
        });
        isSaving = true;
        
        saveToZip(lastIndex, pageTotal);
        console.log('[MelonRipper] Saving zip of book');
    }
});
