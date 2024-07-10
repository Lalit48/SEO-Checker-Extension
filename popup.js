document.getElementById('checkSEO').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: checkSEO,
  }, (results) => {
    const resultText = results[0].result;
    document.getElementById('result').textContent = resultText;
    if (resultText.includes('SEO Issues:')) {
      document.getElementById('downloadIssues').style.display = 'block';
    } else {
      document.getElementById('downloadIssues').style.display = 'none';
    }
  });
});

document.getElementById('downloadIssues').addEventListener('click', () => {
  const issuesText = document.getElementById('result').textContent;
  download('seo_issues.txt', issuesText);
});

function download(filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function checkSEO() {
  let issues = [];

  // Check for title tag
  if (!document.querySelector('title')) {
    issues.push('- Missing title tag.');
  }

  // Check for meta description
  if (!document.querySelector('meta[name="description"]')) {
    issues.push('- Missing meta description.');
  }

  // Check for H1 tag
  if (!document.querySelector('h1')) {
    issues.push('- Missing H1 tag.');
  }

  // Check for alt attributes in images
  document.querySelectorAll('img').forEach(img => {
    if (!img.getAttribute('alt')) {
      issues.push('- Image missing alt attribute: ' + img.src);
    }
  });

  // Check for structured data (schema.org)
  if (!document.querySelectorAll('[itemtype]').length) {
    issues.push('- No structured data (schema.org) found.');
  }

  // Check for robots.txt
  fetch('/robots.txt')
    .then(response => {
      if (!response.ok) {
        issues.push('- Missing or inaccessible robots.txt.');
      }
    })
    .catch(() => {
      issues.push('- Missing or inaccessible robots.txt.');
    });

  // Check for sitemap
  fetch('/sitemap.xml')
    .then(response => {
      if (!response.ok) {
        issues.push('- Missing or inaccessible sitemap.xml.');
      }
    })
    .catch(() => {
      issues.push('- Missing or inaccessible sitemap.xml.');
    });

  // Check for page speed (simple check, real implementation would require an API)
  if (window.performance) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    if (loadTime > 3000) {
      issues.push('- Page load time is more than 3 seconds.');
    }
  }

  // Check for internal links
  let internalLinks = Array.from(document.querySelectorAll('a'))
    .filter(link => link.href.startsWith(window.location.origin));

  if (internalLinks.length < 10) {
    issues.push('- Less than 10 internal links found.');
  }

  // Basic keyword density check
  let bodyText = document.body.innerText;
  let wordCount = bodyText.split(/\s+/).length;
  let keyword = document.title.split(' ')[0];
  let keywordCount = (bodyText.match(new RegExp(keyword, 'gi')) || []).length;

  if (keywordCount / wordCount < 0.01) {
    issues.push('- Keyword density is less than 1%.');
  }

  let result = issues.length ? 'SEO Issues:\n' + issues.join('\n') : 'No major SEO issues found!';
  return result;
}
