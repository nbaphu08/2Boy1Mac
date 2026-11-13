# SPACEMUSE — Exhibit Catalogue & Fact Sheet (v3, đã xác minh)

> Nguồn sự thật duy nhất (single source of truth) cho nội dung. Builder nhập liệu vào `content/*.ts` **chỉ từ file này**.
>
> **Ký hiệu:**
> - ✅ **Đã kiểm chứng** trên trang chính thức của NASA, JPL, NSSDCA hoặc Smithsonian (link nằm ngay cạnh). Lần xác minh: **12/11/2026**.
> - 🔶 **Chưa xác minh**: chỉ được hiển thị sau khi có người mở nguồn kiểm tra; nếu không thì bỏ khỏi trang.
> - ⚠️ **Các nguồn ghi khác nhau**: hiển thị đúng như cột "Cách hiển thị".
>
> **Tóm tắt lần xác minh 12/11:** toàn bộ dữ kiện đã được xác minh. Chỉ còn **1 mục 🔶** (cách diễn đạt về đường Kármán), đã có câu thay thế an toàn. Chữ hiển thị cuối cùng nằm trong `docs/COPY.md`.

---

## Nguồn dữ liệu (dùng làm "NASA data" khi nộp bài)

| Tài nguyên | Đơn vị | Dùng cho | Link |
|---|---|---|---|
| Catalogue of Manmade Material on the Moon (7/2012) | NASA History Program Office | Epilogue, vitrine "Small Objects", **toạ độ cho minimap của mọi hiện vật trên Mặt Trăng** | https://www.nasa.gov/wp-content/uploads/2024/02/final-catalogue-of-manmade-material-on-the-moon.pdf |
| LROC Featured Sites | LROC / ASU cho NASA LRO | Ảnh "Now" trên Mặt Trăng | https://www.lroc.asu.edu/featured_sites |
| Apollo Lunar Surface Journal & Apollo Flight Journal | NASA History Office | Câu chuyện, ảnh "Then" | https://www.nasa.gov/history/alsj-and-afj/ |
| Apollo ALSEP data | NASA PDS Geosciences Node | Curator's notes | https://pds-geosciences.wustl.edu/missions/apollo/ |
| HiRISE (MRO) | University of Arizona / NASA | Ảnh "Now" trên Sao Hỏa | https://www.uahirise.org/ |
| NSSDCA Master Catalog | NASA Goddard | Ngày tháng, khối lượng | https://nssdc.gsfc.nasa.gov/ |
| NASA 3D Resources | NASA | Model `.glb` | https://science.nasa.gov/3d-resources/ · https://github.com/nasa/NASA-3D-Resources |
| NASA Image and Video Library (+ API) | NASA | Toàn bộ footage và ảnh của Act I–II | https://images.nasa.gov/ · API: `https://images-api.nasa.gov/asset/{nasa_id}` |
| NASA's Recommendations… to Protect and Preserve… U.S. Government Lunar Artifacts (2011) | NASA | Epilogue (bảo tồn di sản) | https://www.nasa.gov/wp-content/uploads/2017/10/617743main_nasa-usg_lunar_historic_sites_reva-508.pdf |

> Space Apps công bố danh sách tài nguyên chính thức vào 13/11. Khi đó cần đối chiếu lại với: https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/

---

## HALL I — THE MOON

> **Thứ tự trưng bày theo số hiệu:** SM-L-001 Apollo 11 → SM-L-002 Surveyor 3 → SM-L-003 → SM-L-004 → SM-L-005.
> **Toạ độ cho minimap:** lấy từ Catalogue of Manmade Material on the Moon ✅ (có toạ độ chi tiết cho tầng hạ cánh, gương phản xạ, v.v.).

### SM-L-001 · Apollo 11: Eagle descent stage + Laser Ranging Retroreflector
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Hạ cánh | **20/7/1969**, Sea of Tranquility (Mare Tranquillitatis) | ✅ https://www.nasa.gov/history/july-20-1969-one-giant-leap-for-mankind/ |
| Toạ độ | Tầng hạ cánh LM (có gắn tấm bảng): **0.67408°N, 23.47297°E** · Gương phản xạ: **0.67337°N, 23.47293°E** | ✅ NASA Catalogue (trang 2) |
| Tầng hạ cánh | Đóng vai trò bệ phóng cho tầng cất cánh và **được để lại trên Mặt Trăng**. Hình lăng trụ bát giác, rộng 4,2 m, dày 1,7 m. | ✅ https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C |
| Retroreflector | Đặt ngày 21/7/1969. Không cần nguồn điện. **100 lăng kính góc** xếp thành lưới 10×10. | ✅ https://www.jpl.nasa.gov/news/apollo-11-experiment-still-going-strong-after-35-years/ |
| Vẫn đang hoạt động | Các gương phản xạ Apollo 11, 14, 15 vẫn được dùng để đo khoảng cách bằng laser (ví dụ tại McDonald Observatory). NASA gọi đây là *the last working science experiment from the Apollo era* | ✅ https://www.nasa.gov/missions/laser-beams-reflected-between-earth-and-moon-boost-science/ |
| Huy hiệu | `STILL ACTIVE` | ✅ |
| Đồ vật cùng địa điểm (vitrine) | Cành ô liu bằng vàng, miếng vá Apollo 1, huy chương tưởng niệm các nhà du hành vũ trụ Liên Xô, đĩa tưởng niệm (Moon Memorial Disc) | ✅ NASA Catalogue (trang 2) |

### SM-L-002 · Surveyor 3
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Hạ cánh | ⚠️ **20/4/1967** (UTC), tức 19/4 theo giờ miền Đông nước Mỹ. Oceanus Procellarum. | ✅ https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1967-035A · **Cách hiển thị:** `20 APR 1967` |
| Toạ độ | 3.015°S, 23.418°W | ✅ NASA Catalogue (trang 1) |
| Câu chuyện chính | Apollo 12 hạ cánh **cách Surveyor 3 155 m**. Trong lần EVA thứ hai (**19/11/1969**), phi hành đoàn tháo **camera và gầu xúc đất** mang về Trái Đất để nghiên cứu tác động của khoảng 2,5 năm phơi mình trên Mặt Trăng. | ✅ https://science.nasa.gov/mission/surveyor-3/ |
| Fun fact | *"The only time humans have walked up to a robot they sent to another world — and brought part of it home."* | ✅ (suy ra từ nguồn trên; giữ đúng câu chữ này) |

### SM-L-003 · Apollo 15: Lunar Roving Vehicle
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Lần đầu lái LRV | **31/7/1971**, Hadley‑Apennine | ✅ https://www.nasa.gov/image-article/this-week-nasa-history-first-use-of-lunar-roving-vehicle-july-31-1971/ |
| Cả 3 chiếc LRV đều nằm lại trên Mặt Trăng | NASA Catalogue liệt kê "Lunar Roving Vehicle" trong danh mục vật thể còn lại tại Apollo 15, 16 và 17 | ✅ NASA Catalogue (trang 10, 14, 20) |
| Số lượng chế tạo & chi phí | 4 chiếc được chế tạo (chiếc thứ tư dùng làm phụ tùng). Hợp đồng ban đầu 19 triệu USD, chi phí cuối cùng **38 triệu USD** | ✅ https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html |
| Số vật thể để lại | Phi hành đoàn Apollo 15 để lại **189 vật thể đã được lập danh mục** | ✅ NASA lunar historic sites doc |
| Đồ vật cùng địa điểm (vitrine) | Tượng ***Fallen Astronaut*** kèm tấm bia · cuốn Kinh Thánh James Irwin để lại trên bảng điều khiển LRV · búa và lông chim (thí nghiệm rơi tự do) | ✅ NASA Catalogue (trang 9, 12) |
| Scott đỗ LRV cách LM khoảng 500 feet (~150 m) để camera trên xe truyền hình cảnh cất cánh. Lần đầu tiên Mission Control và khán giả xem trực tiếp một lần cất cánh từ Mặt Trăng | ✅ https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/ |

### SM-L-004 · Apollo 17: Challenger & the last footprints
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Hạ cánh | **11/12/1972**, thung lũng Taurus‑Littrow (20°10'N, 30°46'E) | ✅ https://www.nasa.gov/missions/apollo/apollo-17-mission-details/ |
| Ý nghĩa | **Lần đổ bộ có người lái cuối cùng lên Mặt Trăng.** Artemis II (4/2026) chỉ bay vòng qua Mặt Trăng, không hạ cánh, nên câu này vẫn đúng tại thời điểm 11/2026. | ✅ (nguồn trên) + https://www.nasa.gov/mission/artemis-ii/ |
| Ảnh Now | Ảnh LRO thấy rõ vết bánh xe rover và dấu chân | ✅ https://science.nasa.gov/wp-content/uploads/2024/01/lro-apollo-17-litho.pdf |

### SM-L-005 · GRAIL Ebb & Flow
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Kết thúc | **17/12/2012**, hai tàu song sinh Ebb (GRAIL‑A) và Flow (GRAIL‑B) cố ý đâm vào một ngọn núi gần cực bắc Mặt Trăng | ✅ https://www.jpl.nasa.gov/news/nasas-grail-lunar-impact-site-named-for-astronaut-sally-ride/ |
| Địa điểm | **Sally K. Ride Impact Site**, sườn nam của một ngọn núi cao khoảng 2,5 km gần hố Goldschmidt. Sally Ride từng dẫn dắt chương trình giáo dục MoonKAM của sứ mệnh. | ✅ (cùng nguồn) |
| Ảnh Now | LROC chụp được hai hố va chạm, mỗi hố rộng khoảng 5 m | ✅ https://science.nasa.gov/resource/grail-impact-sites/ |

### Vitrine · Small Objects (đặt trong Exhibit Panel của hiện vật liên quan)
| Hiện vật | Đặt trong panel | Trạng thái |
|---|---|---|
| 2 quả bóng golf của Alan Shepard (Apollo 14, 1971). Ông dùng gậy số 6 đã chế lại để đánh, và hai quả bóng **vẫn còn ở đó** | SM-L-001 (ghi chú: "Other objects left on the Moon") | ✅ NASA Catalogue (trang 8) + https://airandspace.si.edu/stories/editorial/memento-moon-some-what-weve-left-behind |
| Tượng *Fallen Astronaut* và tấm bia (Apollo 15) | SM-L-003 | ✅ NASA Catalogue |
| Ảnh gia đình Charlie Duke (Apollo 16), có chữ ký, bọc trong túi nhựa | SM-L-003 (nhắc tới các LRV khác) | ✅ NASA Catalogue + https://airandspace.si.edu/multimedia-gallery/image/duke-family-photo-full-sizejpeg |

### Con số cho Hall of Silence (Mặt Trăng)
- ✅ **Câu hiển thị:** *"NASA's catalogue of human-made material on the Moon runs 22 pages — from entire spacecraft to two golf balls."*
- Ghi chú: con số "796 vật thể" lấy từ một trang không chính thức. Khi team tự đếm, danh mục có **khoảng 800 dòng mục**, nhưng cách đếm phụ thuộc vào việc xử lý số lượng `[n]` và các vật thể không thuộc Mỹ. **Không hiển thị con số cụ thể.**

---

## HALL II — MARS

### SM-M-001 · Viking 1 Lander
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Hạ cánh | **20/7/1976**, Chryse Planitia. **Tàu vũ trụ đầu tiên của Mỹ hạ cánh lên Sao Hỏa.** Ngày dự kiến ban đầu là 4/7 (kỷ niệm 200 năm nước Mỹ) nhưng bị hoãn hơn 2 tuần vì địa điểm cũ gồ ghề hơn dự kiến. | ✅ https://www.nasa.gov/history/45-years-ago-viking-1-touches-down-on-mars/ |
| Liên lạc cuối | ⚠️ NASA ghi 11/11/1982, NSSDC ghi 13/11/1982 | ✅ **Cách hiển thị:** `NOV 1982` |
| Kết thúc | 21/5/1983 | ✅ https://nssdc.gsfc.nasa.gov/planetary/viking.html |
| Ảnh | Hai tàu đổ bộ Viking gửi về hơn 1.400 ảnh | ✅ (cùng nguồn) |

### SM-M-002 · Mars Pathfinder & Sojourner
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Phóng / hạ cánh | Phóng 4/12/1996 · hạ cánh **4/7/1997**, Ares Vallis (một đồng bằng lũ cổ, thuộc vùng nhiều đá nhất Sao Hỏa) | ✅ https://science.nasa.gov/mission/mars-pathfinder/ |
| Tên | Tàu đổ bộ được đặt tên **Carl Sagan Memorial Station** | ✅ (cùng nguồn) |
| Hạ cánh bằng túi khí | Nảy trên bề mặt nhiều lần rồi mới dừng hẳn | ✅ (cùng nguồn) · ⚠️ số lần nảy khác nhau tuỳ nguồn, **không hiển thị con số** |
| Sojourner | Hoạt động 83 ngày so với kế hoạch 7 ngày | ✅ https://mars.nasa.gov/internal_resources/815/ |
| Liên lạc cuối / kết thúc | 27/9/1997 · 10/3/1998 | ✅ (cùng nguồn) |

### SM-M-003 · Spirit (MER‑A)
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Hạ cánh | **4/1/2004**, miệng hố Gusev | ✅ https://www.jpl.nasa.gov/news/mars-rover-yielding-new-clues-while-lodged-in-martian-soil/ |
| Quãng đường | 7.7 km (4.8 mi) | ✅ https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ |
| Bị kẹt | Bánh xe lún sâu quá trục trong lớp đất mềm tại khu vực **"Troy"** | ✅ **tháng 5/2009** (NASA ghi 1/5/2009; chú thích ảnh JPL ghi sol 1899 = 6/5/2009) · https://science.nasa.gov/mission/mer-spirit/ |
| Phát hiện | Năm 2007 tìm thấy một mảng đất chứa khoảng **90% silica**. Muốn có lượng silica cô đặc như vậy cần có nước, có thể là hơi nước axit từ hoạt động núi lửa. | ✅ https://www.nasa.gov/mission_pages/mer/mer-20070521.html |
| Liên lạc cuối | **22/3/2010** | ✅ https://www.jpl.nasa.gov/news/nasa-concludes-attempts-to-contact-mars-rover-spirit/ |
| Kết thúc | **25/5/2011**, sau hơn 1.300 lệnh khôi phục không có phản hồi. Nguyên nhân có khả năng nhất: quá lạnh khiến bộ sưởi không còn tác dụng. | ✅ (cùng nguồn) + https://science.nasa.gov/mission/mer-spirit/ |

### SM-M-004 · Opportunity (MER‑B)
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Hạ cánh | **24/1/2004** (giờ Mỹ), Meridiani Planum | ✅ https://science.nasa.gov/mission/mer-opportunity/ |
| Thiết kế | 90 sol (ngày Sao Hỏa) | ✅ |
| Quãng đường | **45.16 km** (28.06 mi) | ✅ https://science.nasa.gov/missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/ |
| Liên lạc cuối | **10/6/2018**, sol 5111, do bão bụi phủ toàn hành tinh | ✅ (cùng nguồn) |
| Kết thúc | **13/2/2019**, sau hơn 1.000 lệnh khôi phục | ✅ (cùng nguồn) |
| ⚠️ Câu "My battery is low and it's getting dark" | Là **lời diễn giải của một nhà báo**, không phải tin nhắn thật | ✅ quy tắc nội dung |
| Ảnh | PIA22929 "Opportunity's Last Message" | ✅ https://www.jpl.nasa.gov/images/pia22929-opportunitys-last-message/ |

### SM-M-005 · Phoenix
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Hạ cánh | **25/5/2008**, "Green Valley" thuộc Vastitas Borealis (vùng cực bắc) | ✅ https://science.nasa.gov/mission/mars-phoenix/ |
| Phát hiện | **Xác nhận có băng nước ngay dưới bề mặt.** Những cục vật chất sáng màu trong rãnh đào đã thăng hoa (bốc hơi) sau 4 ngày. | ✅ (cùng nguồn) |
| Liên lạc cuối | ⚠️ **2/11/2008** theo NASA (MDSCC ghi 10/11) | ✅ **Dùng ngày NASA** |
| Kết thúc chính thức | **24/5/2010**, sau khi tàu Odyssey bay qua 61 lần mà không nhận được tín hiệu | ✅ https://www.jpl.nasa.gov/news/phoenix-mars-lander-is-silent-new-image-shows-damage/ |
| Ảnh Now | HiRISE cho thấy tấm pin bị hư. Nhóm sứ mệnh đã dự đoán **sức nặng của lớp băng CO₂** có thể làm cong hoặc gãy tấm pin, và ước tính lớp băng bao phủ tàu vào giữa mùa đông nặng tới "hundreds of pounds". | ✅ (cùng nguồn) |

### SM-M-006 · InSight
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Hạ cánh | **26/11/2018**, Elysium Planitia (~4.5°N, 135.9°E) | ✅ https://science.nasa.gov/mission/insight/ · https://www.jpl.nasa.gov/news/press_kits/insight/launch/mission/landing-site/ |
| Động đất | **1,319 trận**; trận lớn nhất **cấp 5** (5/2022); khoảng 50 sự kiện định vị được, tập trung ở Cerberus Fossae | ✅ https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/ |
| Kết thúc | **21/12/2022**, bụi phủ tấm pin | ✅ (cùng nguồn) |

### SM-M-007 · Ingenuity
| Trường | Giá trị | Trạng thái |
|---|---|---|
| Chuyến bay đầu | **19/4/2021**, kéo dài **39.1 giây**, tại khu vực được đặt tên **Wright Brothers Field**. Đây là chuyến bay có động cơ, có điều khiển đầu tiên trên một hành tinh khác. | ✅ https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/ |
| Mảnh vải Wright Flyer | Ingenuity mang theo một mảnh nhỏ vải bọc cánh của máy bay **Flyer 1** (Kitty Hawk, 1903), quấn quanh một sợi cáp dưới tấm pin mặt trời | ✅ https://www.nasa.gov/history/120-years-ago-the-first-powered-flight-at-kitty-hawk/ |
| Tổng số chuyến | **72** (kế hoạch: tối đa 5) | ✅ https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/ |
| Chuyến cuối / kết thúc | 18/1/2024 · **25/1/2024** | ✅ (cùng nguồn) |

### Vitrine · Debris Field (đặt trong panel SM-M-007)
| Hiện vật | Trạng thái |
|---|---|
| Trong chuyến bay thứ 26 (**19/4/2022**, đúng một năm sau chuyến bay đầu), Ingenuity chụp **10 ảnh màu** của **dù và vỏ sau (backshell)** của Perseverance từ độ cao 8 m, theo đề nghị của các kỹ sư Mars Sample Return | ✅ https://www.nasa.gov/missions/mars-2020-perseverance/ingenuity-helicopter/nasas-mars-helicopter-spots-gear-that-helped-perseverance-rover-land/ |
| **~7,119 kg** phần cứng trên Sao Hỏa: **ước tính của Cagri Kilic (WVU), The Conversation, 9/2022, không phải số liệu của NASA** | ✅ https://www.astronomy.com/science/mars-is-littered-with-thousands-of-pounds-of-trash-from-50-years-of-robotic-exploration/ |
| ~~8/2022 Perseverance phát hiện mảnh vật liệu~~ | **Đã bỏ** (không tìm được nguồn gốc NASA) |

---

## HALL III — BEYOND (teaser: tên + năm + 1 cụm từ)

| Số hiệu | Hiện vật | Hiển thị | Trạng thái |
|---|---|---|---|
| SM-B-001 | NEAR Shoemaker | `2001 · Asteroid Eros · first spacecraft to land on an asteroid` | ✅ https://science.nasa.gov/mission/near-shoemaker/ · ⚠️ NASA ghi 12/2, *Beyond Earth* ghi 13/2, **chỉ hiển thị năm** |
| SM-B-002 | MESSENGER | `2015 · Mercury · impacted the surface at mission end` | ✅ 30/4/2015, hố va chạm rộng khoảng 16 m · https://www.nasa.gov/news-release/nasa-completes-messenger-mission-with-expected-impact-on-mercurys-surface/ |
| SM-B-003 | Cassini | `2017 · Saturn · Grand Finale plunge into the atmosphere` | ✅ 15/9/2017 · https://solarsystem.nasa.gov/missions/cassini/mission/grand-finale/overview |
| SM-B-004 | Voyager 1 | `1977 – · Interstellar space · STILL TRAVELLING` | ✅ vẫn còn liên lạc (mất tín hiệu ngắn ngày 18–19/10/2026, khôi phục ngày 20/10) · https://science.nasa.gov/blogs/voyager/2026/10/29/nasas-voyager-1-conserves-power-resolves-brief-communications-pause/ · ✅ phóng ngày 5/9/1977 · https://www.nasa.gov/history/45-years-ago-voyager-1-begins-its-epic-journey-to-the-outer-planets-and-beyond/ |

⭐ **Chi tiết đắt giá:** **ngày 18/11/2026**, Voyager 1 cách Trái Đất **một ngày ánh sáng** (16.094 tỷ dặm), chỉ vài ngày sau hackathon. Có thể đặt một dòng nhỏ dưới bóng mờ Voyager: *"On 18 Nov 2026, Voyager 1 reaches one light-day from Earth."* ✅ https://science.nasa.gov/mission/voyager/voyager-1/voyager-1-what-is-a-light-day/

---

## Số liệu cho Act II, HUD và các câu dẫn chuyện

| Câu / số liệu | Trạng thái |
|---|---|
| Artemis II phóng lúc **6:35 p.m. EDT, 1/4/2026**, từ LC‑39B (dời từ 6:24 do kéo dài khoảng hold T‑10 phút) | ✅ https://www.nasa.gov/blogs/missions/2026/04/01/live-artemis-ii-launch-day-updates/ |
| Phi hành đoàn Artemis II: Reid Wiseman, Victor Glover, Christina Koch (NASA), Jeremy Hansen (CSA) | ✅ https://www.nasa.gov/mission/artemis-ii/ |
| Artemis II bay xa nhất trong lịch sử loài người: **252,756 dặm** từ Trái Đất, phá kỷ lục năm 1970 của Apollo 13 · bay qua Mặt Trăng ngày 6/4 · hạ cánh xuống biển ngày 10/4/2026 | ✅ (cùng nguồn) + https://www.nasa.gov/news-release/nasa-welcomes-record-setting-artemis-ii-moonfarers-back-to-earth/ |
| SLS tạo **8.8 triệu pound lực đẩy** | ✅ (mô tả clip Artemis I Recap trên images.nasa.gov) |
| Max‑Q xảy ra **trong khoảng 90 giây** sau khi rời bệ | ✅ https://www.nasa.gov/reference/artemis-i-2/ (số liệu của Artemis I; dùng câu chung *"about 90 seconds"*) |
| Tầng đẩy phụ tách ra **khoảng 2 phút** sau khi rời bệ (Artemis I: MET 00:02:12) | ✅ https://www.nasa.gov/artemis-i-press-kit/ · HUD dùng câu chung *"about two minutes"* (Artemis II có thể lệch vài giây) |
| Khoảng cách trung bình Trái Đất–Mặt Trăng **384,400 km** | ✅ https://science.nasa.gov/moon/facts/ |
| Bay tới Sao Hỏa: **"7 to 10 months"** (bỏ cách viết "~7 months") | ✅ https://www.nasa.gov/directorates/smd/how-long-does-it-take-to-get-to-the-moon-mars-jupiter-we-asked-a-nasa-expert-episode-51/ |
| Đường Kármán 100 km | 🔶 hiển thị *"100 km — a widely used boundary of space"*, không gọi đây là ranh giới chính thức |

---

## Danh sách footage và ảnh (đã tìm xong, có NASA ID)

> **Quyết định đã thay đổi:** dùng footage **Artemis II** (phóng 1/4/2026). Đây là vụ phóng **ban ngày, có người lái, có bản 4K và 8K**. Artemis I phóng lúc 1:47 sáng nên trời tối suốt quá trình bay lên, không thể hiện được ý tưởng trời xanh chuyển sang đen.
> Tải file gốc qua `https://images-api.nasa.gov/asset/{nasa_id}` (chọn `~orig`). Credit mặc định là `NASA`, trừ khi cột Credit ghi khác.
> Mốc thời gian (timecode) trong cột "Đoạn cần cắt" là **gợi ý từ khung hình mẫu**. Sonnet phải xem lại file gốc để chọn điểm cắt chính xác.

| Beat | NASA ID | Loại · độ phân giải · thời lượng | Đoạn cần cắt / ghi chú | Credit |
|---|---|---|---|---|
| `hero` | `KSC-20200725-PH-JBS01_0003` | Ảnh ngang 6720×4480 · VAB lúc rạng sáng, mây giông kịch tính | **Lựa chọn đề xuất** (tông tối, hợp design system) | NASA/Ben Smegelsky |
| `hero` (dự phòng) | `KSC-20220119-PH-CSH01_0009` | Ảnh ngang 5760×3840 · VAB lúc bình minh 19/1/2022 (bên trong có SLS Artemis I) | | NASA/Cory Huston |
| `enter` (ảnh cửa) | `KSC-20220317-PH-KLS02_0002` | Ảnh 6720×4480 · cửa VAB mở, SLS/Orion sẵn sàng lăn bánh ra | Dùng cho đoạn camera đi xuyên qua cửa | NASA/Kim Shiflett |
| `enter` (clip) | `KSC-20260319-MH-CSH01-0001-Artemis_II_Rollout_For_Launch_VAB-M19827.MP4` | Video 4K 59.94fps · 6:08 | Đoạn ~1:20: **SLS Artemis II phát sáng bên trong VAB khi cửa mở, lúc đêm** | NASA/Cory S. Huston |
| `enter` (ảnh bên trong, dự phòng) | `KSC-20210917-PH-FMX01_0124` | Ảnh 6720×3780 · nhìn ngước lên SLS trong High Bay 3 | | NASA/Frank Michaux |
| `ignition` (đứng trên bệ) | `SLS_KSC_01282026_ART II at Pad sunset anamorphic` | Video 6144×2160 · 2:14 · hoàng hôn | Rest frame trước đếm ngược. Định dạng siêu rộng, rất điện ảnh | NASA/Sam Lott |
| `ignition` (đánh lửa → cất cánh) | `KSC-20260401-MH-AJN01-0001-Artemis_II_Isolated_Launch_Views-M19183` | Video 4K 60fps · 44:05 | Gồm nhiều góc máy: cận chân tên lửa (~1:00), toàn cảnh tháp (~5:00). Chọn đoạn đánh lửa | NASA |
| `ignition` (thay thế) | `KSC ART II Cause Way Launch low angle` | Video 4K slow-motion · 8:47 | Góc thấp từ đường Causeway | NASA/Sam Lott |
| `ascent-1` | `KSC-20260401-MH-AJN01-0001-Artemis_II_Isolated_Launch_Views-M19183` | (như trên) | ~10:00–20:00: tên lửa bay lên giữa nền trời xanh | NASA |
| `ascent-2` | `KSC-20260401-MH-JBP01-0001-Artemis_II_Launch_Cessna_GSS_8k_60fps-M19183` | Video **8K** 60fps · 4:16 · 6.0 GB | ~0:30–1:30: tên lửa và vệt khói trên nền trời xanh đậm dần | NASA/Jamie Peer |
| `ascent-3` | (Cessna 8K như trên) | | ~2:20–2:35: **hai tầng đẩy phụ tách ra** (thấy các mảnh rời ra). Dự phòng: ảnh `KSC-20260401-PH-SFL01_0029` | NASA/Jamie Peer |
| `ascent-4` | `art002m1200912231B_SAJ-Jettison_SAW4` | Video 1280×720 · 48 giây | Camera trên cánh pin số 4 của Orion: **mây, đường cong Trái Đất và tấm vỏ bảo vệ rời ra** vài phút sau khi phóng. Hợp với caption **WELCOME TO SPACE** | NASA |
| `deep-space` | `art002m1200920011_Apogee_Raise_Burn` | Video 1280×1024 · 33:34 | ~0:30: **Trái Đất nhìn từ Orion**. Crossfade sang cảnh 3D | NASA |
| `deep-space` (dự phòng) | `art001m1013241859ART-DL-1_2022_324_1859_53000_11202022_000000-033946` | Artemis I · Flight Day 5: Orion và Trái Đất lùi xa | | NASA |
| `finale` | `art002e009280b` | Ảnh: **"Artemis Era Earthrise"**, Trái Đất mọc lên từ phía sau Mặt Trăng, chụp qua cửa sổ Orion ngày 6/4/2026 | Rest frame của Finale | NASA |
| Hall I (tuỳ chọn) | `ART-CMA1_2022_325_1250_SHARED_art001m1203251250` | Artemis I · Earthrise sau khi Orion bay sát Mặt Trăng (Outbound Powered Flyby) | Nền cho thẻ tên HALL I | NASA |

**Yêu cầu khi cắt clip:**
1. Cắt bỏ **slate** (khung tiêu đề NASA ở đầu clip), mọi **timecode hoặc chữ ghi đè** (ví dụ số "933" góc phải ở clip Isolated Views, dải dữ liệu trên clip WB‑57), và đồ hoạ NASA TV. Crop hoặc scale nếu cần.
2. Chỉnh màu thống nhất cho tất cả clip: tương phản cao, màu đen sâu, giữ nguyên màu cam của ngọn lửa.
3. Thông số xuất: H.264, `-movflags +faststart`, 1080p khoảng 2–4 MB/clip, cộng bản 720p cho mobile. Poster là khung hình cuối, xuất AVIF.
4. Ghi NASA ID và timecode đã cắt vào `content/beats.ts`, trường `clip.nasaId`.
