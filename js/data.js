/* ==========================================================================
   data.js  -  the ONLY file you need to edit to update the site.

   Every page is built from the lists below. To add something, copy an
   existing { ... } block, paste it under it, and change the values.
   Don't forget the comma between blocks.

   Order matters: items show up in the same order as this list, so put your
   newest work at the top.
   ========================================================================== */

/* ---------- Site-wide details (name, contact info, social links) ---------- */
const SITE = {
  name: "Eric Chen",
  headline: "Stories are meant to live",
  intro:
    "Videographer, photographer and video editor. I shoot and cut short films, events and short form content.",

  contactIntro:
    "Have a project in mind? Send me a message with the date, location and what you want to make, and I'll reply within two days.",
  email: "ec.erichen@gmail.com",
  phone: "", // leave "" to hide
  location: "Toronto, Ontario",
  availability: "Taking bookings for weekends and evenings.", // leave "" to hide

  // Add or remove links freely. Leave the list empty ([]) to hide them.
  socials: [
    { label: "Instagram", url: "https://instagram.com/zxidoesthings" },
    { label: "YouTube", url: "https://www.youtube.com/@ZxiCamera" },
  ],
};

/* ---------- Video projects ----------
   Required:  id, title, category, type, plus videoId (youtube/vimeo) or src (file)
   Optional:  client, year, role, description, thumbnail, featured

   id          Short unique name with no spaces. It becomes the link
               (projects.html#big-buck-bunny), so you can share direct links.
   category    Groups projects into tabs. Tabs are created automatically from
               whatever categories you use here.
   type        "youtube", "vimeo" or "file"
   videoId     youtube: the part after v=  in the URL  (youtube.com/watch?v=THIS)
               vimeo:   the number in the URL          (vimeo.com/THIS)
   src         for type "file": path to an mp4, e.g. "videos/my-film.mp4"
   thumbnail   Path to an image, e.g. "images/thumbs/my-film.jpg".
               YouTube thumbnails are fetched for you, so skip it for YouTube.
   featured    true = shown in the big frame on the home page
   description Shown beside the video. Use a blank line between paragraphs
               (write it inside backticks ` ` to span several lines).
*/
const PROJECTS = [
  {
    id: "WeekZeroRecap",
    title: "Week Zero Frosh Recap 2026",
    category: "Event Film",
    client: "Lassonde York Unviersity",
    year: 2026,
    role: "Director, videographer, ditor",
    type: "youtube",
    videoId: "0gwMGExpwco",
    featured: true,
    description: `Frosh Week is an introduction to university life, defined by high energy, community, and unforgettable first impressions. Approached with a cinematic music-video aesthetic set to 'Beauty and the Beat,' this recap transforms days of live social events and challenges into a vibrant narrative. As my first major multi-day shoot, the project focuses on rhythm, movement, and authentic emotion, giving students a way to look back at the start of their journey.`,

  },

  /* ---- COPY THIS BLOCK to add your next video, then edit the values ----
  {
    id: "my-second-video",
    title: "My Second Video",
    category: "Events",
    client: "Client Name",
    year: 2025,
    role: "Videographer and editor",
    type: "youtube",
    videoId: "PASTE_YOUTUBE_ID_HERE",
    description: "Two or three sentences about the project.",
  },
  ------------------------------------------------------------------- */
];

/* ---------- Photos ----------
   Drop image files in images/photos/ and add a line for each one.
   Required: src, category      Optional: title, description, alt
   Missing images show a grey placeholder until you add the file.
*/
const PHOTOS = [
  { src: "images/photos/CarSmash/Dashboard.png", category: "Car Smash 2026", title: "Dashboard", alt: "Photo of the dashboard before it was smashed" },
  { src: "images/photos/CarSmash/Backside.png", category: "Car Smash 2026", title: "Backside" },
  { src: "images/photos/CarSmash/Car.png", category: "Car Smash 2026", title: "Car", description: "LES - Car Smash 2026" },
  { src: "images/photos/CarSmash/Action.png", category: "Car Smash 2026", title: "Hammer Up!" },
  { src: "images/photos/CarSmash/Close.png", category: "Car Smash 2026", title: "Hammer Side!" },
  { src: "images/photos/CarSmash/hit.png", category: "Car Smash 2026", title: "Boom!" },
  { src: "images/photos/RockClimbing/DSC02382.png", category: "Rock Climbing", title: "THE hold" },
  { src: "images/photos/RockClimbing/DSC02459.png", category: "Rock Climbing", title: "Spider Woman" },
  { src: "images/photos/RockClimbing/DSC02474.png", category: "Rock Climbing", title: "FishEye",  description: "#CelsiusOnCampus" },
  
];
