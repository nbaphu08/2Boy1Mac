# SPACEMUSE — Website Copy (English, final draft v1)

> **Dành cho builder:** đây là toàn bộ chữ hiển thị trên website. Sonnet nhập nguyên văn vào `content/*.ts`; Fable lấy caption beat từ đây. **Không viết thêm sự kiện mới.** Muốn sửa câu chữ thì giữ nguyên sự thật và nguồn.
> Mọi số liệu đều đã được xác minh (12/11/2026). Mã `[S#]` trỏ tới bảng **Sources** ở cuối file. Mục **Media** trỏ tới file trong `materials/` (xem `materials/MANIFEST.md`).
> Chính tả: tiếng Anh kiểu Anh (metres) hay kiểu Mỹ (meters) → **dùng kiểu Mỹ** cho thống nhất với nguồn NASA. Đơn vị: metric trước, imperial trong ngoặc.

---

## 1. Global

- **Site title:** SpaceMuse — A museum of the machines we left behind
- **Meta description:** An interactive museum of NASA hardware left on the Moon and Mars — from Apollo 11's laser mirror to the Ingenuity helicopter — told with real NASA footage, images and data.
- **Wordmark:** SPACEMUSE
- **Tagline:** A museum of the machines we left behind — on the Moon and Mars.
- **Footer disclaimer:** SpaceMuse is an independent project for the NASA Space Apps Challenge 2026. It is not affiliated with or endorsed by NASA. Images and footage courtesy of NASA and partners; see Sources & Credits.
- **Skip button:** Skip to the galleries →
- **Explore button:** Explore exhibit
- **Close:** Close (Esc)
- **Passport:** Museum Passport · {n} of 12 stamps collected
- **Certificate (when 12/12):** Certificate of Visit — {date} — "You have visited every machine in the SpaceMuse collection."
- **Progress rail labels:** KSC · LAUNCH · SPACE · MOON · MARS · SILENCE · BEYOND
- **Reduced-motion notice (small, once):** Motion reduced to match your system settings.

---

## 2. Journey beats (captions)

| Beat | On-screen text |
|---|---|
| `hero` | **SPACEMUSE** / A museum of the machines we left behind / `KENNEDY SPACE CENTER · FLORIDA` / Scroll to begin ↓ / `ADMISSION FREE · EST. VISIT 10 MIN` |
| `enter` | Every journey to another world begins here. / `SPACE LAUNCH SYSTEM · ORION` |
| `ignition` | `T-5 · T-4 · T-3 · T-2 · T-1` → **LIFTOFF** / `ARTEMIS II · 1 APR 2026 · 6:35 P.M. EDT` [S40] |
| `ascent-1` | 8.8 million pounds of thrust. Four astronauts on board. [S41][S42] |
| `ascent-2` | Max-Q — about 90 seconds in, the moment of greatest aerodynamic stress. [S43] |
| `ascent-3` | About two minutes in, the side boosters fall away. [S44] |
| `ascent-4` | **WELCOME TO SPACE** / Above 100 km — a widely used boundary of space. |
| `deep-space` | **HALL I — THE MOON** / `384,400 KM FROM EARTH` [S45] |
| `transit` | **HALL II — MARS** / `7 TO 10 MONTHS OF TRAVEL` [S46] |
| `silence` | **THE HALL OF SILENCE** (xem §5) |
| `beyond` | **HALL III — BEYOND** (xem §6) |
| `finale` | In April 2026, four astronauts flew around the Moon — farther from Earth than any humans before them. The next crews to land will walk past what we left behind. [S42] / Revisit the galleries · Sources & Credits |

**Hall title cards (nhỏ, dưới tên sảnh):**
- Hall I: *Five exhibits, from 1967 to 2012. One small world.*
- Hall II: *Seven machines. Some rolled, one flew, all fell silent.*

---

## 3. HALL I — THE MOON

### SM-L-001 · APOLLO 11
- **Formal name:** Apollo 11 Lunar Module *Eagle* (descent stage) & Laser Ranging Retroreflector
- **Agency:** NASA · **Status badge:** `STILL ACTIVE`
- **Location:** Sea of Tranquility · 0.674°N, 23.473°E [S1]
- **Stats:**
  - Landed — 20 Jul 1969 [S2]
  - Reflector deployed — 21 Jul 1969 [S3]
  - Mirrors — 100 corner-cube prisms (10 × 10) [S3]
  - Power needed — none [S3]
  - Samples returned — 21.55 kg (47.51 lb) [S4]
- **Plaque:** When Eagle's upper half blasted back to orbit, its lower half stayed behind as a launch pad — and it is still there. A few steps away sits a panel of 100 small mirrors. Scientists on Earth still bounce lasers off it today, making it the last working science experiment from the Apollo era.
- **The story:**
  1. On 20 July 1969, the lunar module Eagle touched down on a dusty plain called the Sea of Tranquility. Neil Armstrong and Buzz Aldrin became the first people to walk on another world. [S2]
  2. Eagle was built in two parts. Its descent stage — an eight-sided body 4.2 meters across, standing on four legs — served as the launch platform for the ascent stage that carried the crew back to orbit. The descent stage was left behind. [S5]
  3. Before leaving, the crew set up a laser ranging retroreflector: 100 corner-cube prisms in a 10-by-10 grid that need no power at all. Observatories such as McDonald Observatory in Texas still aim lasers at the Apollo reflectors to measure the distance to the Moon. [S3][S6]
- **What it found:**
  - Brought home 21.55 kg (47.51 lb) of lunar rock and soil. [S4]
  - Laser ranging to the Apollo reflectors is still used to study the Moon's motion and internal structure. [S7]
  - Showed that a crew could land on the Moon, work outside, and launch home again. [S2]
- **Why it went silent:** Most of Eagle was never meant to keep working — the descent stage's last job was to be a launch pad. The reflector is the exception: it has no electronics, so it never went silent.
- **For young explorers:** The reflector works like the reflector on a bicycle: it sends light straight back to where it came from — even across 384,400 km of space. [S45]
- **Curator's notes:** The Apollo 11, 14 and 15 reflectors are three of the five reflector arrays on the Moon; the other two travelled on Soviet Lunokhod rovers. [S6]
- **Also left here (vitrine):** a gold olive branch · an Apollo 1 patch honoring astronauts Grissom, White and Chaffee · medals honoring cosmonauts Gagarin and Komarov · a memorial disc. [S1]
- **Media:** model `SM-L-001_apollo_lunar_module.web.glb` (hiển thị tầng hạ cánh, xem MANIFEST) · Then `SM-L-001_then_as11-40-5948.jpg` — *Buzz Aldrin beside the newly deployed experiments, with Eagle behind him. 20 July 1969.* (NASA) · Now `SM-L-001_now_PIA12909.jpg` — *The Apollo 11 site seen from orbit by NASA's Lunar Reconnaissance Orbiter, 2009.* (NASA/GSFC/Arizona State University)

### SM-L-002 · SURVEYOR 3
- **Formal name:** Surveyor 3 lunar lander · **Agency:** NASA/JPL · **Status:** `SILENT`
- **Location:** Ocean of Storms (Oceanus Procellarum) · 3.015°S, 23.418°W [S1]
- **Stats:**
  - Launched — 17 Apr 1967 [S8]
  - Landed — 20 Apr 1967 (UTC) [S8]
  - Visited by — Apollo 12, November 1969 [S9]
  - Distance to Apollo 12 lander — 155 m [S9]
  - Parts brought home — camera and soil scoop [S9]
- **Plaque:** Surveyor 3 landed alone in 1967. Two and a half years later, it had visitors. Apollo 12 set down just 155 meters away, and two astronauts walked over and took its camera home. It is the only time people have walked up to a robot they sent to another world.
- **The story:**
  1. Before people could land on the Moon, NASA sent robotic Surveyor landers to study its surface. Surveyor 3 touched down in the Ocean of Storms on 20 April 1967. [S8]
  2. In November 1969, Apollo 12 landed just 155 meters away. On their second moonwalk, Pete Conrad and Alan Bean walked over to the old lander. [S9]
  3. They removed its camera and its soil scoop and carried them back to Earth, so scientists could study what two and a half years on the Moon does to a spacecraft. [S9]
- **What it found:**
  - Photographed its landing site and dug into the lunar soil with its scoop. [S9]
  - Its returned parts became a test of how spacecraft materials survive on the Moon. [S9]
  - Gave Apollo 12 a precise target — and the crew landed within 155 meters of it. [S9]
- **Why it went silent:** Surveyor 3 was built for a short mission. By the time Apollo 12 arrived, it had been silent for a long time.
- **For young explorers:** Imagine landing on the Moon and finding a robot that had been waiting there for two and a half years. That happened in 1969.
- **Media:** model — *không có* → ảnh 2.5D `SM-L-002_then-alt_as12-48-7121.jpg` · Then `SM-L-002_then_AS12-48-7134.jpg` — *Alan Bean with Surveyor 3; Apollo 12's lunar module stands in the background. November 1969.* (NASA) · Now `SM-L-002_now_PIA12922.jpg` — *The Apollo 12 site from orbit, Lunar Reconnaissance Orbiter, 2009.* (NASA/GSFC/Arizona State University)

### SM-L-003 · APOLLO 15 LUNAR ROVING VEHICLE
- **Formal name:** Lunar Roving Vehicle (LRV-1) · **Agency:** NASA (built by Boeing) [S10] · **Status:** `SILENT`
- **Location:** Hadley–Apennine · descent stage at 26.132°N, 3.634°E [S1]
- **Stats:**
  - First drive on the Moon — 31 Jul 1971 [S11]
  - Distance driven — 27.9 km (17 mi) [S12]
  - Rovers built — 4 (3 are on the Moon) [S10][S1]
  - Final program cost — $38 million [S10]
  - Objects left by the Apollo 15 crew — 189 [S13]
- **Plaque:** The first car on the Moon. Apollo 15's rover carried Dave Scott and Jim Irwin 27.9 km across the Hadley–Apennine region — far beyond where they could walk. Before leaving, Scott parked it about 150 meters away, its TV camera aimed so people on Earth could watch the liftoff live.
- **The story:**
  1. The Lunar Roving Vehicle was an electric car designed for the Moon's low gravity and airless vacuum. [S14]
  2. On 31 July 1971, Apollo 15 astronauts made the first drive on another world. Over three moonwalks they drove 27.9 km, exploring the foot of the Apennine Mountains and the edge of Hadley Rille. [S11][S12]
  3. At the end, Scott parked the rover about 500 feet (150 m) from the lander, where its TV camera could broadcast their liftoff. For the first time, Mission Control and viewers on Earth watched a lunar liftoff live. [S15]
- **What it found:**
  - Helped the crew collect the "Genesis Rock," made almost entirely of plagioclase feldspar — a piece of the Moon's most ancient crust. [S16]
  - Proved a vehicle could multiply how far astronauts could explore.
  - Apollo 15 also left a laser reflector with 300 corner cubes, still used today. [S13][S6]
- **Why it went silent:** It was never meant to come home. Every kilogram returned to Earth had to be launched off the Moon, so the rover stayed behind with the lander's descent stage.
- **For young explorers:** Four of these rovers were built. Three are still on the Moon. The fourth was used for spare parts. [S10]
- **Also left here (vitrine):** the *Fallen Astronaut* sculpture and plaque · a Bible left on the rover's dashboard by Jim Irwin · the hammer and feather from a famous gravity demonstration. [S1] · *Elsewhere:* Charlie Duke left a family photograph at the Apollo 16 site. [S1][S17]
- **Media:** model — *không có* → ảnh 2.5D `SM-L-003_then_as15-88-11901.jpg` · Then (same) — *The Apollo 15 rover against the lunar mountains, 1 August 1971.* (NASA) · Now `SM-L-003_now_GSFC_20171208_Archive_e001054.jpg` — *LRO's view over Hadley Rille and Mount Hadley, the Apollo 15 landing region.* (NASA/GSFC/Arizona State University) — **chú ý:** ảnh này cho thấy khu vực, không thấy chiếc xe.

### SM-L-004 · APOLLO 17
- **Formal name:** Apollo 17 Lunar Module *Challenger* (descent stage), rover and experiments · **Agency:** NASA · **Status:** `SILENT`
- **Location:** Taurus–Littrow valley · 20°10'N, 30°46'E [S18]
- **Stats:**
  - Landed — 11 Dec 1972 [S18]
  - Samples returned — 110.5 kg [S19]
  - Status — the last crewed Moon landing (as of 2026) [S18][S42]
- **Plaque:** In December 1972, Gene Cernan and Harrison Schmitt explored the valley of Taurus–Littrow. When they left, they left their lander's base, their rover, their experiments — and the last human footprints on the Moon. Cameras in orbit can still see the rover tracks today.
- **The story:**
  1. Apollo 17 landed on 11 December 1972 in a valley ringed by mountains, called Taurus–Littrow. [S18]
  2. At one stop, the crew found soil that was bright orange. It turned out to be made almost entirely of tiny beads of orange glass. [S20]
  3. Apollo 17 remains the last time people walked on the Moon. In April 2026, Artemis II astronauts flew around the Moon — but did not land. [S18][S42]
- **What it found:**
  - Collected the orange soil — almost entirely orange glass. [S20]
  - Brought home 110.5 kg of samples. [S19]
  - Orbital images from LRO still show its rover tracks and footprints. [S21]
- **Why it went silent:** The descent stage stayed as a launch pad, and the rover stayed because there was no way to bring it home.
- **For young explorers:** With no wind or rain on the Moon, footprints there can last a very long time.
- **Media:** model `SM-L-001_apollo_lunar_module.web.glb` (dùng lại, đặt nhãn Challenger) · Then `SM-L-004_then_as17-147-22526.jpg` — *Gene Cernan drives the rover during the first Apollo 17 moonwalk.* (NASA) · Now `SM-L-004_now_LRO-apollo17-litho.jpg` — *The Apollo 17 site from orbit: descent stage, rover tracks and footprints.* (NASA/GSFC/Arizona State University)

### SM-L-005 · GRAIL — EBB & FLOW
- **Formal name:** Gravity Recovery and Interior Laboratory (GRAIL-A "Ebb" & GRAIL-B "Flow") · **Agency:** NASA/JPL · **Status:** `IMPACT SITE`
- **Location:** Sally K. Ride Impact Site, near Goldschmidt crater, north polar region [S22]
- **Stats:**
  - Impact — 17 Dec 2012 [S22]
  - Craters — about 5 m wide each [S23]
  - Moon's average crust thickness measured — 34 to 43 km [S24]
- **Plaque:** Ebb and Flow were twin spacecraft that flew one behind the other around the Moon, mapping its gravity. At the end of their mission in December 2012, NASA steered them into a mountain near the north pole on purpose. The site is named for Sally Ride, America's first woman in space.
- **The story:**
  1. By measuring tiny changes in the distance between them, the twins mapped the Moon's gravity in extraordinary detail. [S24]
  2. They found the Moon's crust is 34 to 43 km thick on average — 10 to 20 km thinner than previously thought — and full of cracks and pores. [S24]
  3. On 17 December 2012 the twins hit a mountain near the north pole. NASA named the site after Sally Ride, who led the mission's MoonKAM education program. [S22]
- **What it found:**
  - The highest-resolution gravity map of any world. [S24]
  - A thinner crust than expected: 34–43 km on average. [S24]
  - Highland crust that is less dense and more porous than assumed. [S24]
- **Why it went silent:** On purpose. The mission ended with a planned impact.
- **For young explorers:** The craters Ebb and Flow made are only about 5 meters wide — about the length of a car. [S23]
- **Media:** model — *không có* → ảnh `SM-L-005_then_PIA13965.jpg` (**phải ghi rõ "Artist's concept"**) · Now `SM-L-005_now_GRAIL_impacts_before_after.png` — *Before and after: LRO images of the two impact sites.* (NASA/GSFC/Arizona State University)

---

## 4. HALL II — MARS

### SM-M-001 · VIKING 1 LANDER
- **Formal name:** Viking 1 Lander (Thomas A. Mutch Memorial Station) · **Agency:** NASA · **Status:** `SILENT`
- **Location:** Chryse Planitia [S25]
- **Stats:**
  - Landed — 20 Jul 1976 [S25]
  - Last transmission — Nov 1982 [S26]
  - Mission ended — 21 May 1983 [S26]
  - Images from both Viking landers — more than 1,400 [S26]
- **Plaque:** The first American spacecraft to land on Mars. Minutes after touching down on 20 July 1976, Viking 1 photographed its own footpad resting on Martian soil. It kept working for more than six years, reporting the weather and testing the soil for signs of life.
- **The story:**
  1. Viking 1 was meant to land on 4 July 1976, America's 200th birthday. Orbital photos showed the chosen site was too rough, so the team searched for a safer one — and landed more than two weeks later. [S25]
  2. Its first photograph, taken just minutes after landing, showed one of its footpads on the rocky ground of Chryse Planitia. [S27]
  3. For more than six years it measured the weather, studied the soil and sent pictures home, until its final transmission in November 1982. [S26]
- **What it found:**
  - A cold, dry world: between about −86 °C and −30 °C the day after landing. [S27]
  - Soil with almost 100 times as much sulfur as soil on Earth or the Moon. [S27]
  - Biology experiments found unexpected chemistry in the soil, but no definitive evidence of life. [S27]
- **Why it went silent:** Its final transmission came in November 1982. Engineers tried for about six and a half months to regain contact before the mission ended in May 1983. [S26]
- **For young explorers:** Viking 1's very first picture from Mars was of its own foot.
- **Media:** model `SM-M-001_viking_lander.web.glb` · Then `SM-M-001_then_PIA00381.jpg` — *The first photograph taken on the surface of Mars, 20 July 1976.* (NASA/JPL) · Now `SM-M-001_now_PIA01881.jpg` — *Viking 1 seen from orbit by HiRISE, 2006.* (NASA/JPL-Caltech/University of Arizona)

### SM-M-002 · MARS PATHFINDER & SOJOURNER
- **Formal name:** Mars Pathfinder lander (Carl Sagan Memorial Station) and Sojourner rover · **Agency:** NASA/JPL · **Status:** `SILENT`
- **Location:** Ares Vallis [S28]
- **Stats:**
  - Launched — 4 Dec 1996 [S28]
  - Landed — 4 Jul 1997 [S28]
  - Planned mission — 7 days · Actual — 83 days [S29]
  - Images from the lander — more than 16,000 [S30]
  - Final data — 27 Sep 1997 [S29]
- **Plaque:** Pathfinder reached Mars on 4 July 1997 wrapped in airbags, bouncing across the ground before rolling to a stop. Out drove Sojourner, NASA's first Mars rover. The mission was planned to last a week. It lasted 83 days.
- **The story:**
  1. Pathfinder landed inside a cocoon of airbags and bounced until it came to rest in Ares Vallis, an ancient flood plain. [S28]
  2. Sojourner rolled down a ramp and drove from rock to rock, measuring what they were made of. [S30]
  3. The lander was renamed the Carl Sagan Memorial Station, honoring the astronomer who had died the year before. [S28]
- **What it found:**
  - More than 16,000 images from the lander and about 550 from the rover. [S30]
  - Wind had stripped away several centimeters of material from the surface. [S30]
  - Clues that Mars was once warmer and wetter, with liquid water and a thicker atmosphere. [S30]
- **Why it went silent:** The last data arrived on 27 September 1997. Engineers tried for about five months to restore contact before the mission formally ended on 10 March 1998. [S29][S28]
- **For young explorers:** Pathfinder landed by bouncing — like a giant beach ball.
- **Media:** model — *không có* → ảnh 2.5D `SM-M-002_then-alt_PIA00632.jpg` · Then `SM-M-002_then_PIA00614.jpg` — *Deflated airbags and Sojourner on the lander, July 1997.* (NASA/JPL) · Now `SM-M-002_now_PIA09105.jpg` — *The Pathfinder landing site and surroundings from orbit, HiRISE, 2007.* (NASA/JPL-Caltech/University of Arizona) — **chú ý:** ảnh toàn cảnh khu hạ cánh; chưa xác nhận tàu có hiện rõ trong ảnh hay không.

### SM-M-003 · SPIRIT
- **Formal name:** Mars Exploration Rover A (MER-A) "Spirit" · **Agency:** NASA/JPL · **Status:** `SILENT`
- **Location:** Gusev Crater → Home Plate, "Troy" [S31]
- **Stats:**
  - Landed — 4 Jan 2004 [S31]
  - Distance driven — 7.7 km (4.8 mi) [S32]
  - Stuck at "Troy" — May 2009 [S33]
  - Last contact — 22 Mar 2010 [S34]
  - Mission ended — 25 May 2011 [S34]
- **Plaque:** Spirit landed in Gusev Crater in January 2004 and explored for six years. In 2007 it uncovered bright soil that was about 90% silica — a sign that water, perhaps volcanic steam, once soaked this ground. In 2009 it became trapped in soft sand at a place called Troy, and kept doing science where it stood.
- **The story:**
  1. Spirit landed on 4 January 2004, three weeks before its twin, Opportunity. It crossed the plains of Gusev Crater and climbed into the Columbia Hills. [S31][S35]
  2. In 2007 it uncovered a patch of soil about 90% silica. Making that much silica needs water — possibly acidic steam from volcanic activity. [S36]
  3. In May 2009 its wheels sank into soft soil beside Home Plate, at a site the team called Troy. Unable to drive free, Spirit kept working as a stationary science station. [S33][S37]
- **What it found:**
  - Soil about 90% silica — evidence of past water. [S36]
  - A long record of the Columbia Hills, including a climb up Husband Hill. [S35]
  - Science from a standstill: studying the soil it was stuck in. [S37]
- **Why it went silent:** Stuck and unable to tilt its solar panels toward the Sun, Spirit faced a hard Martian winter. The most probable cause of the loss of contact was extreme cold that made its survival heaters ineffective. More than 1,300 commands went unanswered. [S34][S38]
- **For young explorers:** By the end, Spirit was driving with only five working wheels. [S39]
- **Media:** model `SM-M-003-004_mer_spirit_opportunity.web.glb` · Then `SM-M-003_then_PIA05040.jpg` — *Spirit stretches out on its lander, January 2004.* (NASA/JPL) · Now `SM-M-003_now_PIA12205.jpg` — *Spirit at Troy, seen from orbit by HiRISE, 2009.* (NASA/JPL-Caltech/University of Arizona)
- **Lưu ý:** câu "unable to tilt its solar panels toward the Sun" chưa có nguồn riêng; nếu không xác minh được thì bỏ cụm này, chỉ giữ câu về cái lạnh.

### SM-M-004 · OPPORTUNITY
- **Formal name:** Mars Exploration Rover B (MER-B) "Opportunity" · **Agency:** NASA/JPL · **Status:** `SILENT`
- **Location:** Meridiani Planum → Endeavour Crater [S47]
- **Stats:**
  - Landed — 24 Jan 2004 [S47]
  - Designed for — 90 sols (Martian days) [S47]
  - Distance driven — 45.16 km (28.06 mi) [S48]
  - Last contact — 10 Jun 2018 (sol 5111) [S48]
  - Mission ended — 13 Feb 2019 [S48]
- **Plaque:** Opportunity was built to last 90 Martian days. It kept going for more than 14 years and drove 45.16 km — longer than a marathon. Along the way it found tiny iron-rich spheres nicknamed "blueberries" and mineral veins laid down by water long ago.
- **The story:**
  1. Opportunity landed on 24 January 2004 on the flat plains of Meridiani Planum. It was designed for a 90-sol mission. [S47]
  2. It became the first rover to identify and study sedimentary rocks on another planet, and found hematite "blueberries" formed by acidic groundwater. [S49]
  3. At Endeavour Crater it found veins of gypsum and clay minerals formed in water friendly enough for ancient microbes. [S49][S50]
- **What it found:**
  - Hematite "blueberries" — a sign that liquid water once soaked these rocks. [S49]
  - Gypsum veins deposited by water. [S50]
  - Clays formed in neutral water — the friendliest conditions for ancient life it studied. [S49]
- **Why it went silent:** In June 2018 a dust storm wrapped the entire planet. With sunlight blocked from its solar panels, Opportunity's power dropped too low to talk to Earth. More than 1,000 commands to restore contact went unanswered. [S48]
- **For young explorers:** Opportunity's odometer passed 42.195 km in 2015. It ran a marathon on Mars. [S51]
- **Curator's notes:** A widely shared line — "My battery is low and it's getting dark" — is a journalist's paraphrase of the rover's final data, not a message the rover sent. Its real final transmission is shown here as data. [S52]
- **Media:** model `SM-M-003-004_mer_spirit_opportunity.web.glb` · Then `SM-M-004_then_PIA17759.jpg` — *Self-portrait, January 2014.* (NASA/JPL-Caltech/Cornell/Arizona State Univ.) · Extra `SM-M-004_then-lastmessage_PIA22929.jpg` — *Opportunity's last image, 2018.* · Now `SM-M-004_now_PIA22549.jpg` — *Opportunity after the dust storm, seen by HiRISE, 2018.* (NASA/JPL-Caltech/University of Arizona)
- **Lưu ý credit:** dùng đúng credit ghi trên trang PIA tương ứng (Sonnet kiểm tra lại khi nhập).

### SM-M-005 · PHOENIX
- **Formal name:** Phoenix Mars Lander · **Agency:** NASA/JPL · **Status:** `SILENT`
- **Location:** "Green Valley," Vastitas Borealis — the northernmost landing on Mars [S53]
- **Stats:**
  - Landed — 25 May 2008 [S53]
  - Last signal — 2 Nov 2008 [S53]
  - Mission formally ended — 24 May 2010 [S54]
- **Plaque:** Phoenix landed farther north than any spacecraft before it, and dug into the Martian Arctic. It confirmed water ice just below the surface and watched snow fall from the clouds. Then the long polar winter came. Images from orbit later showed its solar panels damaged, probably by the weight of frozen carbon dioxide.
- **The story:**
  1. Phoenix touched down on 25 May 2008 in the far north of Mars. [S53]
  2. Its robotic arm dug trenches. Bright clumps in the soil vanished after four days — water ice turning to vapor. [S53]
  3. A laser instrument pointed at the sky detected snow falling from clouds about 4 km up. The snow vaporized before reaching the ground. [S55]
- **What it found:**
  - Water ice just beneath the surface. [S53]
  - Perchlorate in the soil — the mission's biggest surprise, a salt that strongly attracts water. [S55]
  - Snow falling from Martian clouds. [S55]
- **Why it went silent:** As winter arrived, sunlight faded and its solar panels could not make enough power. Phoenix sent its last signal on 2 November 2008. In 2010, the orbiter Odyssey listened during 61 passes and heard nothing. [S53][S54]
- **For young explorers:** Phoenix saw snow on Mars — but the flakes disappeared before they reached the ground. [S55]
- **Media:** model — *không có* → ảnh 2.5D `SM-M-005_then_PIA11719.jpg` · Then (same) — *Phoenix self-portrait on the Martian Arctic plains, 2008.* (NASA/JPL-Caltech/University of Arizona/Texas A&M University) · Now `SM-M-005_now_PIA22223.jpg` — *Phoenix seen from orbit nearly a decade later, HiRISE, 2018.* (NASA/JPL-Caltech/University of Arizona)

### SM-M-006 · INSIGHT
- **Formal name:** Interior Exploration using Seismic Investigations, Geodesy and Heat Transport (InSight) · **Agency:** NASA/JPL · **Status:** `SILENT`
- **Location:** Elysium Planitia · ~4.5°N, 135.9°E [S56]
- **Stats:**
  - Landed — 26 Nov 2018 [S56]
  - Marsquakes detected — 1,319 [S57]
  - Largest — magnitude 5 (May 2022) [S57]
  - Mission ended — 21 Dec 2022 [S57]
- **Plaque:** InSight didn't drive anywhere. It sat still and listened. Its seismometer felt 1,319 marsquakes, letting scientists map the inside of the planet. Year by year, dust settled on its solar panels — until there was no longer enough power to keep listening.
- **The story:**
  1. InSight landed on 26 November 2018 on Elysium Planitia, a flat, safe plain chosen because its job was to study the inside of Mars, not the surface. [S56]
  2. It placed a seismometer on the ground and recorded 1,319 marsquakes. The largest, magnitude 5, struck in May 2022. [S57]
  3. Quake waves revealed the layers of Mars: a crust about 25 to 40 km thick under the lander, and a molten core larger than expected. [S58]
- **What it found:**
  - 1,319 marsquakes, many from a region called Cerberus Fossae. [S57]
  - A crust about 25–40 km thick beneath the lander, in three layers. [S58]
  - A liquid core about 1,800 km in radius. [S58]
- **Why it went silent:** Dust slowly covered its solar panels. When the team failed to reach it twice in a row, they concluded its batteries had run out. NASA retired the mission on 21 December 2022. [S57]
- **For young explorers:** InSight took selfies. Compare its first and last ones and you can watch Mars dust slowly bury it. [S59]
- **Media:** model `SM-M-006_insight_panels_deployed.web.glb` · Then `SM-M-006_then_PIA22876.jpg` — *InSight's first selfie, December 2018.* + `SM-M-006_then-final_PIA25287.jpg` — *Its final selfie, 2022.* (NASA/JPL-Caltech) · Now `SM-M-006_now_PIA23376.jpg` — *InSight from orbit, HiRISE, 2019.* (NASA/JPL-Caltech/University of Arizona)

### SM-M-007 · INGENUITY
- **Formal name:** Ingenuity Mars Helicopter · **Agency:** NASA/JPL · **Status:** `SILENT`
- **Location:** Jezero Crater → "Valinor Hills" [S60]
- **Stats:**
  - First flight — 19 Apr 2021, 39.1 seconds [S61]
  - Flights planned — up to 5 · Flights flown — 72 [S62]
  - Last flight — 18 Jan 2024 [S62]
  - Mission ended — 25 Jan 2024 [S62]
- **Plaque:** The first aircraft to make a powered, controlled flight on another planet. Ingenuity was built to try up to five flights. It flew 72. Tucked beneath its solar panel it carried a small piece of fabric from the Wright brothers' 1903 Flyer.
- **The story:**
  1. On 19 April 2021, Ingenuity rose into the thin air of Mars for 39.1 seconds, at a spot the team named Wright Brothers Field. [S61]
  2. It became a scout for the Perseverance rover, flying 72 times over nearly three years. [S62]
  3. On its 72nd flight, smooth, featureless ground confused its navigation system; a rough landing damaged its rotor blades, ending its flying days. [S62]
- **What it found:**
  - Powered flight is possible in Mars's thin atmosphere. [S61]
  - Aerial scouting can guide a rover's path. [S62]
  - On flight 26 it photographed the parachute and backshell that had carried Perseverance to the surface. [S63]
- **Why it went silent:** After its final flight on 18 January 2024 damaged its rotor blades, NASA ended the mission on 25 January 2024. [S62]
- **For young explorers:** The first powered flight on Earth (1903) and the first on Mars (2021) are linked by a scrap of fabric. [S64]
- **Also here (vitrine — The Debris Field):** On 19 April 2022 — one year after its first flight — Ingenuity photographed Perseverance's parachute and cone-shaped backshell from 8 meters up. [S63] · Researcher Cagri Kilic (West Virginia University) estimated in 2022 that about 7,119 kg of human hardware now lies on Mars — an independent estimate, not a NASA figure. [S65]
- **Media:** model `SM-M-007_ingenuity.web.glb` · Then `SM-M-007_then-alt_PIA26236.jpg` — *Perseverance spots Ingenuity at its final airfield, 2024.* (NASA/JPL-Caltech/ASU/MSSS) · Now `SM-M-007_now_PIA25174.jpg` — *HiRISE spots Perseverance and Ingenuity, 2022.* (NASA/JPL-Caltech/University of Arizona) · Vitrine `SM-M-007_vitrine-backshell_PIA25219.jpg`, `SM-M-007_vitrine-debris_PIA25218.jpg` (NASA/JPL-Caltech)

---

## 5. The Hall of Silence

- **Title:** THE HALL OF SILENCE
- **Intro:** Every machine in this museum once talked to Earth. These are the last times we heard from them.
- **Wall (name — last contact):**
  - Viking 1 — November 1982
  - Mars Pathfinder — 27 September 1997
  - Phoenix — 2 November 2008
  - Spirit — 22 March 2010
  - Opportunity — 10 June 2018
  - InSight — December 2022 *(mission retired 21 Dec 2022)*
  - Ingenuity — last flight 18 January 2024
  - GRAIL Ebb & Flow — 17 December 2012 *(planned impact)*
  - Surveyor 3 — 1967
  - Apollo 11 reflector — **still answering** (glows instead of dimming)
- **Numbers:**
  - NASA's catalogue of human-made material on the Moon runs 22 pages — from entire spacecraft to two golf balls. [S1]
  - About 7,119 kg of hardware on Mars — an independent estimate by Cagri Kilic (WVU), 2022. [S65]
- **Heritage paragraph:** In 2011, NASA published recommendations for protecting historic Apollo sites — asking future visitors to keep their distance from the descent stages, footprints and rover tracks. These places are a museum that already exists. [S13]
- **Lưu ý:** câu "asking future visitors to keep their distance…" là tóm tắt nội dung tài liệu S13; Sonnet nên đọc nhanh tài liệu để chỉnh câu cho sát.

## 6. Hall III — Beyond (teaser)

- **Title:** HALL III — BEYOND · OPENING SOON
- **Line:** The fleet didn't stop at Mars. Some went to other worlds. Some are still leaving.
- **Silhouettes (hover/focus):**
  - SM-B-001 · NEAR Shoemaker — 2001 · Asteroid Eros · First spacecraft to land on an asteroid [S66]
  - SM-B-002 · MESSENGER — 2015 · Mercury · Impacted the surface at mission end [S67]
  - SM-B-003 · Cassini — 2017 · Saturn · Grand Finale plunge into the atmosphere [S68]
  - SM-B-004 · Voyager 1 — 1977– · Interstellar space · `STILL TRAVELLING` [S69]
- **Small line under Voyager:** On 18 November 2026, Voyager 1 reaches one light-day from Earth. [S70]
- **Media:** silhouette dựng trực tiếp từ model `SM-B-00x_*.web.glb` (material đen, chỉ viền sáng) — không cần ảnh riêng.

## 7. About & Sources page

- **Heading:** About SpaceMuse
- **Body:** SpaceMuse treats the machines humanity left on the Moon and Mars as museum objects. Every date and number on this site comes from NASA, JPL, NSSDCA or the Smithsonian, and every exhibit lists its sources. Footage and images come from the NASA Image and Video Library, the Lunar Reconnaissance Orbiter Camera (LROC) and HiRISE.
- **Built for:** NASA Space Apps Challenge 2026 — "Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars."
- **Team:** 2Boy1Mac — *(điền tên thành viên)*
- **AI disclosure (template):** SpaceMuse was planned and built with the help of AI assistants (Anthropic's Claude models) for research, writing and code. All facts were checked against the primary sources listed below. No AI-generated images or footage are used; every image is a real NASA or partner image unless labelled "Artist's concept".
- **Data credits:** NASA Image and Video Library · NASA/GSFC/Arizona State University (LROC) · NASA/JPL-Caltech/University of Arizona (HiRISE) · NASA Scientific Visualization Studio (CGI Moon Kit, Deep Star Maps 2020) · NASA Earth Observatory (Blue Marble) · NASA/JPL/USGS (Viking MDIM 2.1 color mosaic) · NASA 3D Resources.
- **Disclaimer:** như footer.

---

## Sources

| ID | Source | URL |
|---|---|---|
| S1 | NASA History Program Office — Catalogue of Manmade Material on the Moon (2012) | https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf |
| S2 | NASA — July 20, 1969: One Giant Leap for Mankind | https://www.nasa.gov/history/july-20-1969-one-giant-leap-for-mankind/ |
| S3 | JPL — Apollo 11 Experiment Still Going Strong after 35 Years | https://www.jpl.nasa.gov/news/apollo-11-experiment-still-going-strong-after-35-years/ |
| S4 | NASA History — Apollo 11 summary (SP-4029) | https://history.nasa.gov/SP-4029/Apollo_11a_Summary.htm |
| S5 | NSSDCA — Apollo 11 Lunar Module / EASEP | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C |
| S6 | NASA — Retroreflectors: From Apollo to Mars | https://www.nasa.gov/image-article/retroreflectors-from-apollo-mars/ |
| S7 | NASA — Laser Beams Reflected Between Earth and Moon Boost Science | https://www.nasa.gov/missions/laser-beams-reflected-between-earth-and-moon-boost-science/ |
| S8 | NSSDCA — Surveyor 3 | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A |
| S9 | NASA Science — Surveyor 3 | https://science.nasa.gov/mission/surveyor-3/ |
| S10 | NSSDCA — The Apollo Lunar Roving Vehicle | https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html |
| S11 | NASA — First Use of the Lunar Roving Vehicle, July 31, 1971 | https://www.nasa.gov/image-article/this-week-nasa-history-first-use-of-lunar-roving-vehicle-july-31-1971/ |
| S12 | Apollo 15 Lunar Surface Journal — Mission Overview | https://www.history.nasa.gov/alsj/a15/a15ov.html |
| S13 | NASA — Recommendations to Protect and Preserve U.S. Government Lunar Artifacts (2011) | https://www.nasa.gov/wp-content/uploads/2017/10/617743main_nasa-usg_lunar_historic_sites_reva-508.pdf |
| S14 | NASA — Lunar Rover | https://www.nasa.gov/stem-ed-resources/lunar-rover.html |
| S15 | NASA — 50 Years Ago: Apollo 15 on the Moon at Hadley-Apennine | https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/ |
| S16 | NASA Science — History of Lunar Exploration | https://science.nasa.gov/solar-system/moon/history-of-lunar-exploration/ |
| S17 | Smithsonian NASM — Charles Duke's Family Photograph on the Moon | https://airandspace.si.edu/multimedia-gallery/image/duke-family-photo-full-sizejpeg |
| S18 | NASA — Apollo 17: Mission Details | https://www.nasa.gov/missions/apollo/apollo-17-mission-details/ |
| S19 | NASA — Lunar Samples: Apollo Collection Tools, Curation Handling… | https://www.nasa.gov/wp-content/uploads/2019/04/02_allton_corrected_apollo.pdf |
| S20 | NASA — Apollo 17 Preliminary Science Report, Soil Mechanics | https://www.nasa.gov/wp-content/uploads/static/history/alsj/WOTM//a17psr_Section8_SoilMechanics.pdf |
| S21 | NASA Science — LRO: Viewing Traces of Apollo 17 (lithograph) | https://science.nasa.gov/wp-content/uploads/2024/01/lro-apollo-17-litho.pdf |
| S22 | JPL — GRAIL Lunar Impact Site Named for Astronaut Sally Ride | https://www.jpl.nasa.gov/news/nasas-grail-lunar-impact-site-named-for-astronaut-sally-ride/ |
| S23 | NASA Science — GRAIL Impact Sites | https://science.nasa.gov/resource/grail-impact-sites/ |
| S24 | JPL — NASA's GRAIL Creates Most Accurate Moon Gravity Map | https://www.jpl.nasa.gov/news/nasas-grail-creates-most-accurate-moon-gravity-map/ |
| S25 | NASA — 45 Years Ago: Viking 1 Touches Down on Mars | https://www.nasa.gov/history/45-years-ago-viking-1-touches-down-on-mars/ |
| S26 | NSSDCA — Viking Project Information | https://nssdc.gsfc.nasa.gov/planetary/viking.html |
| S27 | NASA Science — Viking Spacecraft and Science | https://science.nasa.gov/mission/viking/spacecraft-and-science/ |
| S28 | NASA Science — Mars Pathfinder | https://science.nasa.gov/mission/mars-pathfinder/ |
| S29 | NASA Mars — Mars Pathfinder was the first completed mission… | https://mars.nasa.gov/internal_resources/815/ |
| S30 | JPL — Missions: Mars Pathfinder | https://www3.jpl.nasa.gov/missions/past/marspathfinder.html |
| S31 | JPL — Mars Rover Yielding New Clues While Lodged in Martian Soil | https://www.jpl.nasa.gov/news/mars-rover-yielding-new-clues-while-lodged-in-martian-soil/ |
| S32 | NASA Science — Mars Exploration Rovers: Spirit and Opportunity | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ |
| S33 | NASA Science — Spirit | https://science.nasa.gov/mission/mer-spirit/ |
| S34 | JPL — NASA Concludes Attempts to Contact Mars Rover Spirit | https://www.jpl.nasa.gov/news/nasa-concludes-attempts-to-contact-mars-rover-spirit/ |
| S35 | (= S31) Gusev plains, Husband Hill, Columbia Hills | https://www.jpl.nasa.gov/news/mars-rover-yielding-new-clues-while-lodged-in-martian-soil/ |
| S36 | NASA — Mars Rover Spirit Unearths Surprise Evidence of Wetter Past | https://www.nasa.gov/mission_pages/mer/mer-20070521.html |
| S37 | NASA — Spirit Embedded in Soft Soil on Mars… | https://www.nasa.gov/image-article/spirit-embedded-soft-soil-mars-as-engineers-devise-methods-free-spirit/ |
| S38 | (= S33) cause of loss of contact | https://science.nasa.gov/mission/mer-spirit/ |
| S39 | JPL — Mars Rover Spirit (mission page) | https://www.jpl.nasa.gov/missions/mars-exploration-rover-spirit-mer-spirit/ |
| S40 | NASA — Artemis II Launch Day Updates | https://www.nasa.gov/blogs/missions/2026/04/01/live-artemis-ii-launch-day-updates/ |
| S41 | NASA Image Library — Artemis I Launches to the Moon (Official NASA Recap) (8.8 million lb thrust) | https://images.nasa.gov/details/Artemis%20I%20Launches%20to%20the%20Moon%20(Official%20NASA%20Recap) |
| S42 | NASA — Artemis II mission | https://www.nasa.gov/mission/artemis-ii/ |
| S43 | NASA — Artemis I (reference) | https://www.nasa.gov/reference/artemis-i-2/ |
| S44 | NASA — Artemis I Press Kit | https://www.nasa.gov/artemis-i-press-kit/ |
| S45 | NASA Science — Moon Facts | https://science.nasa.gov/moon/facts/ |
| S46 | NASA — How Long Does it Take to Get to the Moon… Mars…? | https://www.nasa.gov/directorates/smd/how-long-does-it-take-to-get-to-the-moon-mars-jupiter-we-asked-a-nasa-expert-episode-51/ |
| S47 | NASA Science — Opportunity | https://science.nasa.gov/mission/mer-opportunity/ |
| S48 | NASA Science — NASA's Opportunity Rover Mission on Mars Comes to End | https://science.nasa.gov/missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/ |
| S49 | NASA Science — MER Science Highlights | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/ |
| S50 | JPL — NASA Mars Rover Finds Mineral Vein Deposited by Water | https://www.jpl.nasa.gov/news/nasa-mars-rover-finds-mineral-vein-deposited-by-water/ |
| S51 | NASA Image Library — PIA19157 Opportunity Rover Surpasses Marathon Distance | https://images.nasa.gov/details/PIA19157 |
| S52 | JPL — PIA22929 Opportunity's Last Message | https://www.jpl.nasa.gov/images/pia22929-opportunitys-last-message/ |
| S53 | NASA Science — Mars Phoenix | https://science.nasa.gov/mission/mars-phoenix/ |
| S54 | JPL — Phoenix Mars Lander is Silent, New Image Shows Damage | https://www.jpl.nasa.gov/news/phoenix-mars-lander-is-silent-new-image-shows-damage/ |
| S55 | JPL — NASA Mars Lander Sees Falling Snow, Soil Data Suggest Liquid Past | https://www.jpl.nasa.gov/news/nasa-mars-lander-sees-falling-snow-soil-data-suggest-liquid-past/ |
| S56 | NASA Science — InSight Lander | https://science.nasa.gov/mission/insight/ |
| S57 | NASA — NASA Retires InSight Mars Lander Mission After Years of Science | https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/ |
| S58 | NASA Science — InSight Science Highlights | https://science.nasa.gov/mission/insight/science-highlights/ |
| S59 | NASA Image Library — PIA22876 / PIA25287 (InSight selfies) | https://images.nasa.gov/details/PIA25287 |
| S60 | NASA Image Library — PIA26237 Ingenuity at 'Valinor Hills' | https://images.nasa.gov/details/PIA26237 |
| S61 | NASA Science — Ingenuity Mars Helicopter | https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/ |
| S62 | NASA — After Three Years on Mars, NASA's Ingenuity Helicopter Mission Ends | https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/ |
| S63 | NASA — NASA's Mars Helicopter Spots Gear That Helped Perseverance Rover Land | https://www.nasa.gov/missions/mars-2020-perseverance/ingenuity-helicopter/nasas-mars-helicopter-spots-gear-that-helped-perseverance-rover-land/ |
| S64 | NASA — 120 Years Ago: The First Powered Flight at Kitty Hawk | https://www.nasa.gov/history/120-years-ago-the-first-powered-flight-at-kitty-hawk/ |
| S65 | Astronomy (republished from The Conversation) — Mars is littered with… trash (Cagri Kilic, 2022) | https://www.astronomy.com/science/mars-is-littered-with-thousands-of-pounds-of-trash-from-50-years-of-robotic-exploration/ |
| S66 | NASA Science — NEAR Shoemaker | https://science.nasa.gov/mission/near-shoemaker/ |
| S67 | NASA — NASA Completes MESSENGER Mission with Expected Impact on Mercury's Surface | https://www.nasa.gov/news-release/nasa-completes-messenger-mission-with-expected-impact-on-mercurys-surface/ |
| S68 | NASA Science — Cassini Grand Finale Overview | https://solarsystem.nasa.gov/missions/cassini/mission/grand-finale/overview |
| S69 | NASA — 45 Years Ago: Voyager 1 Begins its Epic Journey | https://www.nasa.gov/history/45-years-ago-voyager-1-begins-its-epic-journey-to-the-outer-planets-and-beyond/ |
| S70 | NASA Science — Voyager 1: What Is a Light-Day | https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/ |
