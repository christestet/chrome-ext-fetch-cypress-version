const changelogUrl = 'https://docs.cypress.io/guides/references/changelog';
const alarmName = 'changelogAlarm';

// Setup alarm to fetch every 3 hours
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(alarmName, {
        periodInMinutes: 8 * 60
    });
});

// Listen for alarm and fetch on alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === alarmName) {
        fetchChangelog();
        fetchLatestRelease('cypress-io', 'cypress');
    }
});
const fetchLatestRelease = async (repoOwner, repoName) => {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
        const data = await response.json();
        const cypressVersion = data.tag_name

        chrome.storage.local.get(['cypressVersion'], (result) => {
            if (result.cypressVersion !== cypressVersion) {
                chrome.storage.local.set({ cypressVersion: cypressVersion });
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'Cypress Update',
                    message: `A new Cypress Version is available: ${cypressVersion}`
                });
            }
            chrome.storage.local.get(['cypressVersion'], (result) => {
                console.log(`Current Chrome Storrage for cypressVersion: ${result.cypressVersion}`);
            });
        });
        //Save Cypress Version to Chrome Storrage
        chrome.storage.local.set({ cypressVersion: cypressVersion });
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};



// Fetch changelog and store to local storage
async function fetchChangelog() {
    try {
        const response = await fetch(changelogUrl);
        const text = await response.text();

        // Regex to find the content within h2 tags, and stops at the next h2
        const regex = /<h2.*?>[\s\S]*?(?=<h2)/;
        const match = text.match(regex);
        const changelogContent = match ? match[0] : '';

        // Compare with previous content
        chrome.storage.local.get(['changelogContent'], (result) => {
            if (result.changelogContent !== changelogContent) {
                chrome.storage.local.set({ changelogContent: changelogContent });
            }
            chrome.storage.local.get(['changelogContent'], (result) => {
                console.log(`Current Chrome Storrage for changelogContent: ${result.changelogContent}`);
            });
        });
    } catch (error) {
        console.error('Error fetching changelog:', error);
    }
}

// Fetch the changelog when the extension is installed or updated
fetchChangelog();
fetchLatestRelease('cypress-io', 'cypress');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'fetchChangelog') {
        fetchChangelog();

    } else if (request.message === 'fetchLatestRelease') {
        fetchLatestRelease('cypress-io', 'cypress');
    }
});
