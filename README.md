# Videography / Photography Portfolio

A static site (plain HTML, CSS and JavaScript) that works on GitHub Pages with no build step.

## Folder layout

```
index.html        Home page
projects.html     Projects and clients, with category tabs and a popup for each video
photos.html       Photo gallery, with category tabs and a viewer
contact.html      Contact details
css/style.css     Colours and layout (palette is at the top)
js/data.js        Your content. This is the file you edit.
js/main.js        Builds the pages from data.js. Rarely needs changes.
images/           placeholder.svg, plus photos/ for your pictures
videos/           Optional home for small .mp4 files
```

## How it works

The pages don't contain your videos directly. `js/data.js` holds a list of
projects, and `js/main.js` loops over that list to draw the tiles, the category
tabs and the popup. Adding a video means adding one entry to the list. Nothing
else changes.

## Add a video

1. Open `js/data.js`.
2. Copy the commented template block inside `PROJECTS`, paste it under the last entry, and remove the comment markers.
3. Fill in the values:

```js
{
  id: "my-second-video",          // unique, no spaces; used in the share link
  title: "My Second Video",
  category: "Events",             // a new category creates a new tab automatically
  client: "Client Name",
  year: 2025,
  role: "Videographer and editor",
  type: "youtube",                // "youtube", "vimeo" or "file"
  videoId: "PASTE_YOUTUBE_ID_HERE",
  description: "What the project was and what you did.",
},
```

4. Save, commit and push. Refresh the site.

Finding the video ID:

- YouTube: in `youtube.com/watch?v=abc123XYZ`, the ID is `abc123XYZ`. YouTube thumbnails load automatically.
- Vimeo: in `vimeo.com/123456789`, the ID is `123456789`. Vimeo needs a `thumbnail` image (see below).
- Your own file: use `type: "file"` and `src: "videos/my-film.mp4"`. GitHub rejects files over 100 MB and Pages is slow for large video, so YouTube or Vimeo is a better choice for full films.

Every project gets its own link, for example `yoursite.com/projects.html#my-second-video`. Send that to a client to open the popup directly.

### Longer descriptions

Use backticks for several paragraphs. A blank line starts a new paragraph:

```js
description: `First paragraph about the brief.

Second paragraph about the shoot and edit.`,
```

### Custom thumbnails

Put the image in a folder such as `images/thumbs/` and add
`thumbnail: "images/thumbs/my-film.jpg"` to the entry.

## Add photos

1. Copy the image into `images/photos/`. Resize large photos to about 2000 px on the long edge first, so the page loads quickly.
2. Add a line to `PHOTOS` in `js/data.js`:

```js
{ src: "images/photos/wedding-01.jpg", category: "Events", title: "First dance" },
```

Filenames are case sensitive on GitHub Pages. `Photo.JPG` and `photo.jpg` are different files.

## Edit your details

Name, headline, email, phone, location and social links are all in the `SITE` block at the top of `js/data.js`. The contact page and footer update from there.

## Change the colours

The four palette colours are variables at the top of `css/style.css`:

```css
--forest: #0c3b2e;  --sage: #6d9773;  --tan: #bb8a52;  --amber: #ffba00;
```

## Preview on your computer

Some embeds (YouTube especially) refuse to play when a page is opened straight from disk, so use a small local server instead of double-clicking the file:

```
cd portfolio-site
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

1. Create a repository on GitHub and push these files to the `main` branch, with `index.html` at the top level.
2. In the repository go to **Settings, Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

Naming the repository `YOUR-USERNAME.github.io` puts the site at `https://YOUR-USERNAME.github.io/` with no extra path.
