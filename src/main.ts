interface SearchEngine {
    /** duckduckgo */
    id: string,
    /** DuckDuckGo */
    name: string,
    hostname: string,
    /** `q` in ?q= */
    queryKey: string,
    /** https://duckduckgo.com/?q={} */
    queryUrl: string,
}

interface CurrentState {
    keyword: string,
    currentEngine: SearchEngine,
    nextEngine: SearchEngine,
}

const ENGINES: SearchEngine[] = [
    {
        id: 'duckduckgo',
        name: 'DuckDuckGo',
        hostname: 'duckduckgo.com',
        queryKey: 'q',
        queryUrl: 'https://duckduckgo.com/?q={}',
    },
    { 
        id: 'startpage',
        name: 'StartPage',
        hostname: 'www.startpage.com',
        queryKey: 'query',
        queryUrl: 'https://www.startpage.com/do/dsearch/?query={}',
    },
    { 
        id: 'bing',
        name: 'Bing',
        hostname: 'www.bing.com',
        queryKey: 'q',
        queryUrl: 'https://www.bing.com/search?q={}',
    },
    { 
        id: 'google',
        name: 'Google',
        hostname: 'www.google.com',
        queryKey: 'q',
        queryUrl: 'https://www.google.com/search?q={}',
    },
]

const SUPPORTED_HOST = ENGINES.map(x => x.hostname)
function urlIsSupported (url?: string) {
    if (!url) {return false}
    for (let host of SUPPORTED_HOST) {
        if (url.includes(host)) { return true }
    }
    return false
}

function getCurrentState (currentUrl?: string): CurrentState | null {
    if (!currentUrl) {return null}
    const urlObj = new URL(currentUrl + '')
    const curIdx = ENGINES.findIndex(x => x.hostname === urlObj.hostname)
    if (curIdx === -1) { return null }
    const curEng = ENGINES[curIdx]
    const params = new URLSearchParams(urlObj.search)
    const keyword = params.get(curEng.queryKey) || ''
    const nextEng = ENGINES[(curIdx + 1) % ENGINES.length]
    return {
        keyword: keyword,
        currentEngine: curEng,
        nextEngine: nextEng
    }
}

function initPageAction (tab: browser.tabs.Tab) {
    if (urlIsSupported(tab.url)) {
        const tabId = Number(tab.id)
        // browser.pageAction.setIcon({tabId: tabId})
        browser.pageAction.show(tabId)
    }
}

browser.pageAction.onClicked.addListener(function (tab) {
    const state = getCurrentState(tab.url)
    if (!state) {return console.error('[To Developer] This should not happen.')}
    browser.tabs.update(tab.id, {
        url: state.nextEngine.queryUrl.replace(/{}/, state.keyword)
    })
})

browser.tabs.query({currentWindow: false, active: true}).then((tabs) => {
    for (let tab of tabs) {
        initPageAction(tab)
    }
})
