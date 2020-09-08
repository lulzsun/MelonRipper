(function init() {
    document.getElementById('downloadBtn').addEventListener('click', function() {
        browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            browser.tabs.sendMessage(tabs[0].id, {
                command: 'ask_Download',
            });
        });
    });

    browser.runtime.onMessage.addListener((message) => {
        if (message.command === 'send_BookDetails') {
            // if melonripper.js sent book details, lets set them for visuals
            setBookDetails(message.pages);
            if(message.isSaving == false) {
                document.getElementById('downloadBtn').style.display = 'block';
                document.getElementById('loadingGif').style.display = 'none';
            }
        }else if (message.command === 'send_Download') {
            // if melonripper.js sent download status, lets set them for visuals
            if(message.status === 'saving') {
                document.getElementById('downloadBtn').style.display = 'none';
                document.getElementById('loadingGif').style.display = 'block';
            } else {
                document.getElementById('downloadBtn').style.display = 'block';
                document.getElementById('loadingGif').style.display = 'none';
            }
        }
    });

    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {
            command: 'ask_BookDetails',
        });
    });
})();

function setBookDetails(pages) {
    var pageCount = document.getElementById('pageCount');
    var pageStatus = document.getElementById('pageStatus');

    for(let i = 0; i < pages.length; i++) {
        let node1 = document.createElement('A'); 
        node1.setAttribute('id', '30px');
        node1.setAttribute('style', 'display:inline-block;width:35px;text-align:center');

        const zeroPad = (num, places) => String(num).padStart(places, '0')
        node1.textContent = zeroPad(i+1, 3);
        pageCount.appendChild(node1);

        let node2 = document.createElement('A'); 
        node2.setAttribute('id', '30px');
        node2.setAttribute('style', 'display:inline-block;width:35px;text-align:center');

        if(pages[i]) {
            node2.textContent = `☒`;
            node2.style.color = 'white';
            node2.style.backgroundColor = 'green';
        } else {
            node2.textContent = `☐`;
            node2.style.color = 'white';
            node2.style.backgroundColor = 'red';
        }
        pageStatus.appendChild(node2);
    }
}