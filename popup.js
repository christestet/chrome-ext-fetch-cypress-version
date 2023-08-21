const fetchBtn = document.getElementById("fetchBtn");
const themeSwitcher = document.getElementById("themeSwitcher");
const changelogContentElement = document.getElementById("changelogContent");
const cypressVersionElement = document.getElementById("cypressVersion");

fetchBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ message: "fetchChangelog" });
    chrome.runtime.sendMessage({ message: "fetchLatestRelease" });
    console.log("Update Button pressed.");
});

chrome.storage.local.get(
    [
        "changelogContent",
        "cypressVersion",
        "theme",
    ],
    result => {
        if (result.changelogContent) {
            changelogContentElement.innerHTML = result.changelogContent;
        } else {
            changelogContentElement.textContent = "No changelog content found.";
        }

        if (result.cypressVersion) {
            cypressVersionElement.innerHTML = result.cypressVersion;
        } else {
            cypressVersionElement.textContent = "No Current Version Found";
        }

        if (result.theme) {
            setThemeMode(result.theme);
        } else {
            setThemeMode("light");
        }
    }
);

themeSwitcher.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark")
        ? "dark"
        : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    setThemeMode(newTheme);

    chrome.storage.local.set({ theme: newTheme }, () => {
        console.log("Theme mode is set to ", newTheme);
    });
});

function setThemeMode(theme) {
    if (theme === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeSwitcher").innerHTML =
            '<i class="fas fa-sun"></i><br>Light';
    } else {
        document.body.classList.remove("dark");
        document.getElementById("themeSwitcher").innerHTML =
            '<i class="fas fa-moon"></i><br>Dark';
    }
}

function markdownToHtml(markdown) {
    const lines = markdown.split("\r\n");

    let html = "";
    for (const line of lines) {
        const heading = line.match(/^(#{1,6}) /);
        if (heading) {
            const level = heading[1].length;
            html += `<h${level}>${line.slice(level + 1)}</h${level}>`;
        } else if (line.startsWith("* ")) {
            let content = line.slice(2);
            let linkIndex = content.lastIndexOf(" in ");
            if (linkIndex > -1) {
                let link = content.slice(linkIndex + 4);
                let text = content.slice(0, linkIndex);
                text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
                html += `<p><li>${text} in <a href="${link}">${link}</a></li></>`;
            } else {
                html += `<p><li>${content}</li></p>`;
            }
        } else if (line.startsWith("**")) {
            let content = line.slice(2, -2);
            let linkIndex = content.lastIndexOf(": ");
            if (linkIndex > -1) {
                let link = content.slice(linkIndex + 2);
                let text = content.slice(0, linkIndex);
                html += `<strong>${text}: <a href="${link}">${link}</a></strong>`;
            }
        } else {
            html += `${line}`;
        }
    }

    return html;
}

document.addEventListener('DOMContentLoaded', function () {
    fetch(chrome.runtime.getURL('/manifest.json'))
        .then(response => response.json())
        .then(manifestData => {
            document.getElementById("extensionVersion").innerText = 'Current Extension Version: ' + manifestData.version;
        });
});
