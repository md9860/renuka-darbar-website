PHOTO / VIDEO SLIDER - HOW TO ADD MEDIA

1. Put photos in: assets/gallery/photos/
2. Put MP4 videos in: assets/gallery/videos/
3. Open index.html and find: id="mediaSliderTrack"

PHOTO example:
<article class="media-slide"><div class="media-card"><span class="media-type">📷 फोटो</span><img src="assets/gallery/photos/navratri-01.jpg" alt="नवरात्रोत्सव" loading="lazy"><div class="media-caption"><strong>नवरात्रोत्सव</strong><span>श्री क्षेत्र रेणुका दरबार, सोनई</span></div></div></article>

VIDEO example:
<article class="media-slide"><div class="media-card"><span class="media-type">▶ व्हिडिओ</span><video controls preload="metadata" playsinline><source src="assets/gallery/videos/navratri-01.mp4" type="video/mp4"></video><div class="media-caption"><strong>नवरात्रोत्सव</strong><span>उत्सव व्हिडिओ</span></div></div></article>

Add each new <article> inside mediaSliderTrack. Slider dots are generated automatically.
