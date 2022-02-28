// define global variables
var imageArray = [];
var isSaving = false;
var tenth = 0;
var pageTotal = 0;

// create an observer instance, in order to detect page changes
const observer = new MutationObserver(function(mutations) {


    for(let mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && mutation.target.className.includes('view-sheet-focus')) {



            savePages(mutation.target.firstChild.nextSibling.childNodes);

        }
    }
});

// the first function to run on page load
(function init() {
    var target = document.body.getElementsByClassName('flipsnap')[0];
    var firstPage = document.body.getElementsByClassName('view-sheet-focus')[0];



    if(target != null) {
        // init imageArray length
        pageTotal = parseInt(document.body.getElementsByClassName('slider-label')[0].textContent.split('/')[1]);
        imageArray = Array.apply(null, Array(pageTotal)).map(function () {});

        // delete view-protection, just for better visual
        var doc = document.body.getElementsByClassName('view-protection')[0].remove();



        savePages(firstPage.firstChild.nextSibling.childNodes);

        observer.observe(target, { attributes: true, childList: true, subtree: true });

    } else {
        setTimeout(init, 1000);
    }
})();

// get images from canvases that are in focus (visible to the reader) and save to global var
function savePages(pages) {

    var pageIndex = parseInt(document.body.getElementsByClassName('slider-label')[0].textContent.split('/')[0])-1;

    for(var i = pages.length - 1; i >= 0; i--) { // loop backwards, because manga reads right to left
        if(pages[i].tagName === 'CANVAS') {
            //save image as base64
            imageArray[pageIndex] = pages[i].toDataURL().replace(/^data:image\/(png);base64,/, '');

            console.log(`[MelonRipper] Saved page ${pageIndex+1} of ${imageArray.length}`);
            pageIndex++;

        }

            if(pageIndex % 10 == 0){
                saveToZip(tenth, pageIndex);
                tenth = pageIndex;
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
        saveToZip(tenth, pageTotal);
        console.log('[MelonRipper] Saving zip of book');
    }
});
