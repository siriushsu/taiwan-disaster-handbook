/** Bilingual text helper for PDF content */
const TEXT: Record<string, [string, string]> = {
  // [Chinese, English]
  // Cover
  cover_title: ['家庭防災手冊', 'Taiwan Family Emergency Handbook'],
  cover_sub: ['緊急時請依本手冊指示行動', 'Follow this handbook during emergencies'],
  cover_addr: ['主住家地址', 'Home Address'],
  cover_members: ['家庭成員', 'Family Members'],
  cover_meeting: ['災後集合點', 'Post-Disaster Meeting Point'],
  cover_contact: ['外縣市聯絡人（失聯時打這支）', 'Out-of-City Contact (call when disconnected)'],
  cover_date: ['製作日期', 'Created'],
  cover_update: ['建議每年更新', 'Update annually'],
  cover_footer: ['列印後放在家中顯眼位置（冰箱旁或玄關）。', 'Print and keep visible at home (fridge or entrance).'],
  cover_qr: ['掃描 QR Code 可重新產生或分享給家人。', 'Scan QR Code to regenerate or share with family.'],

  // Action Card
  action_title: ['緊急行動卡 — 撕下此頁貼在冰箱上', 'EMERGENCY ACTION CARD — Tear off and stick on fridge'],
  action_sub: ['任何災難的前 3 分鐘決定生死。看完這頁你就知道該怎麼做。', 'The first 3 minutes decide life or death. This page tells you what to do.'],
  eq_title: ['地震', 'Earthquake'],
  eq_action: ['趴下 → 躲桌下或靠牆蹲 → 護頭 → 搖停後穿鞋關瓦斯 → 走樓梯（不搭電梯）→ 前往集合點', 'Drop → Cover under table → Protect head → After shaking: shoes on, gas off → Take stairs (NO elevator) → Go to meeting point'],
  air_title: ['防空警報（連續長音 90 秒）', 'Air Raid Alert (continuous tone 90 sec)'],
  air_action: ['立刻進入地下室、地下停車場、捷運站 → 遠離窗戶 → 聽廣播等「解除警報」（短音 30 秒）→ 聽到解除前不要出來', 'Enter basement/parking garage/MRT station immediately → Stay away from windows → Listen for "all clear" (short tone 30 sec) → Do NOT exit before all clear'],
  fire_title: ['火災', 'Fire'],
  typhoon_title: ['颱風 / 水災', 'Typhoon / Flood'],
  typhoon_action: ['警報發布 → 備妥 72 小時物資 → 收室外物品 → 關窗 → 低窪地區提前撤離 → 停電就關總開關', 'Warning issued → Prepare 72hr supplies → Bring outdoor items inside → Close windows → Evacuate low areas early → Power outage: main switch off'],
  meeting_label: ['災後全家集合地點', 'Post-Disaster Family Meeting Point'],

  // Emergency numbers
  num_fire: ['消防救護', 'Fire & Rescue'],
  num_police: ['警察', 'Police'],
  num_air: ['防空警報', 'Air Raid Alert'],
  num_msg: ['災害留言板', 'Disaster Message Board'],
  num_mental: ['安心專線', 'Mental Health Hotline'],
  num_disaster: ['災防專線', 'Disaster Prevention'],

  // Reunion
  reunion_title: ['家人集合與通訊計畫', 'Family Reunion & Communication Plan'],
  reunion_desc: ['災難後手機可能不通。事先約好集合點和聯絡順序，是找到家人最可靠的方法。', 'Phones may not work after a disaster. Pre-arranged meeting points and contact order are the most reliable way to find family.'],
  reunion_members: ['每位家人的位置與避難資訊', 'Each Member\'s Location & Shelter Info'],
  reunion_addr: ['住址', 'Address'],
  reunion_shelter: ['最近避難所', 'Nearest Shelter'],
  reunion_mobility: ['行動不便，需要協助撤離', 'Mobility impaired, needs evacuation assistance'],
  reunion_meds: ['必帶藥物', 'Must-bring medication'],
  comm_title: ['通訊順序（手機能通時）', 'Communication Order (when phones work)'],
  comm_1: ['先確認自身安全，離開危險區域', 'First confirm your own safety, leave danger zone'],
  comm_2: ['發一則簡訊或 LINE 給家庭群組：「我在 [地點]，[安全/受傷]」', 'Send SMS or LINE to family group: "I\'m at [location], [safe/injured]"'],
  comm_3: ['簡訊比電話更容易在網路壅塞時送出', 'Text messages are more likely to get through when networks are jammed'],
  comm_5: ['前往集合點，到達後清點家人', 'Go to meeting point, do headcount on arrival'],
  nophone_title: ['手機不通時怎麼辦', 'When phones don\'t work'],
  nophone_1: ['撥打 1991 災害留言板：錄音留言「我是 [姓名]，在 [地點]，[狀況]」', 'Call 1991 Disaster Message Board: Record "I am [name], at [location], [status]"'],
  nophone_2: ['家人也撥 1991 輸入你的手機號碼就能聽留言', 'Family can call 1991, enter your phone number to hear your message'],
  nophone_3: ['前往約定集合點等候（每 2 小時回來確認一次）', 'Go to agreed meeting point and wait (return every 2 hours to check)'],
  nophone_4: ['在住家門口用筆留字條：「[日期時間] 全家已前往 [集合點名稱]」', 'Leave a note at your door: "[date/time] Family went to [meeting point]"'],
  nophone_5: ['到集合點後向現場志工登記姓名與人數', 'Register name and headcount with volunteers at meeting point'],
  contacts_title: ['緊急聯絡人', 'Emergency Contacts'],

  // Location page
  loc_guide: ['完整避難指南', 'Complete Evacuation Guide'],
  loc_dir: ['方位速查（從住家出發）', 'Direction Guide (from home)'],
  loc_meeting: ['家人集合點', 'Family Meeting Point'],
  loc_meeting_desc: ['災難發生後，全家人應前往以下地點會合。到達後清點人數，未到者由外縣市聯絡人協調。', 'After a disaster, all family members should go to the following locations. Do headcount on arrival.'],
  loc_primary: ['主要集合點', 'Primary Meeting Point'],
  loc_backup: ['備用集合點', 'Backup Meeting Point'],
  loc_shelters: ['附近避難收容所（政府指定）', 'Nearby Shelters (Government Designated)'],
  loc_shelters_src: ['資料來源：內政部消防署 避難收容處所開放資料', 'Source: Ministry of Interior Fire Bureau Open Data'],
  loc_airraid: ['防空避難所（軍事衝突用）', 'Air Raid Shelters (Military Conflict)'],
  loc_medical: ['最近醫療院所', 'Nearest Medical Facilities'],
  loc_apt_title: ['公寓大樓逃生重點', 'Apartment Evacuation Tips'],
  loc_house_title: ['透天厝逃生重點', 'Townhouse Evacuation Tips'],
  loc_no_data: ['查無附近收容所資料。請向里辦公室查詢，或撥打 0800-024-985。', 'No shelter data found. Contact your local village office or call 0800-024-985.'],

  // Member overview
  member_title: ['家人資料總覽', 'Family Member Overview'],
  member_desc: ['每位成員的避難、健康、聯絡資訊。急救時請出示此頁給醫護人員。', 'Each member\'s shelter, health, and contact info. Show this page to paramedics during emergencies.'],
  member_footer: ['家人資料（急救時出示給醫護人員）', 'Family Data (show to paramedics)'],

  // Supply checklist
  supply_title: ['72 小時緊急物資清單', '72-Hour Emergency Supply Checklist'],
  supply_desc: ['大型災難後可能 3 天沒有外援。以下物資請平時備妥，每半年檢查有效期。', 'No outside help for up to 3 days after a major disaster. Prepare these supplies and check expiry every 6 months.'],
  supply_food: ['飲水與食物', 'Water & Food'],
  supply_medical: ['急救與藥品', 'First Aid & Medicine'],
  supply_hygiene: ['衛生用品', 'Hygiene'],
  supply_comm: ['通訊與照明', 'Communication & Light'],
  supply_docs: ['文件與現金', 'Documents & Cash'],
  supply_clothes: ['衣物與工具', 'Clothing & Tools'],
  supply_tip: ['建議準備一個「緊急背包」放在玄關。災難來臨時抓了就走，不要花時間找東西。', 'Prepare a "go bag" at the entrance. Grab it and go — don\'t waste time looking for things.'],

  // Scenarios
  eq_full_title: ['地震完整應對指南', 'Complete Earthquake Response Guide'],
  eq_at_home: ['在家中', 'At Home'],
  eq_outdoor: ['在戶外', 'Outdoors'],
  eq_after: ['地震後注意事項', 'Post-Earthquake Notes'],
  air_full_title: ['防空警報應對指南', 'Air Raid Alert Response Guide'],
  air_sound: ['警報聲音辨識：連續長音 90 秒 ＝ 防空警報（立刻躲避）｜連續短音 30 秒 ＝ 解除警報', 'Alert sounds: Continuous 90s = Air Raid (take cover) | Short 30s = All Clear'],
  air_after: ['聽到警報後', 'After hearing the alert'],
  fire_full_title: ['火災應對指南', 'Fire Response Guide'],
  fire_when: ['發現火災時', 'When you discover a fire'],
  typhoon_full_title: ['颱風與水災應對指南', 'Typhoon & Flood Response Guide'],
  typhoon_before: ['颱風來臨前 24 小時', '24 Hours Before Typhoon'],
  typhoon_during: ['颱風期間', 'During Typhoon'],
  typhoon_after: ['颱風過後', 'After Typhoon'],

  // Reminders
  remind_title: ['重要備忘與定期檢查', 'Important Reminders & Regular Checks'],
  remind_equip: ['住家安全設備位置（請手寫填入）', 'Home Safety Equipment Locations (fill in by hand)'],
  remind_check: ['半年一次定期檢查', 'Biannual Check'],
  remind_check_desc: ['建議每年 3 月和 9 月各做一次。', 'Recommended every March and September.'],
  remind_memo: ['重要資訊備忘（請手寫填入）', 'Important Info Memo (fill in by hand)'],
  remind_final: ['這本手冊只有在你讀過、你的家人也知道的情況下才有用。今天就和家人一起翻一遍，確認每個人都知道集合點在哪裡。', 'This handbook is only useful if you\'ve read it and your family knows about it. Go through it with your family today.'],

  // Infant
  infant_title: ['家中有嬰幼兒 — 特別注意', 'Infant at home — Special attention'],

  // Fire action (apartment)
  fire_apt: ['低姿勢爬行 → 摸門把不燙才開門 → 走安全梯下樓 → 打 119', 'Crawl low → Touch door handle (if not hot, open) → Take stairs → Call 119'],
  fire_house: ['蹲低移動 → 從最近出口離開 → 不要回頭拿東西 → 打 119', 'Stay low → Exit through nearest door → Don\'t go back for belongings → Call 119'],

  // Infant tips
  infant_1: ['疏散時用背帶揹住嬰兒，雙手才能自由行動', 'Use a baby carrier during evacuation to keep hands free'],
  infant_2: ['奶粉、尿布、奶瓶隨緊急背包一起放在玄關', 'Keep formula, diapers, bottles in the go-bag at the entrance'],
  infant_3: ['嬰兒對溫度敏感：冬天多帶毛毯，夏天避免中暑', 'Babies are temperature-sensitive: bring blankets in winter, avoid heatstroke in summer'],
  infant_4: ['到避難所後優先告知工作人員有嬰幼兒，可安排優先區域', 'At shelters, inform staff about your baby for priority placement'],
  infant_5: ['保持嬰兒情緒穩定：帶安撫奶嘴或熟悉的小玩具', 'Bring pacifier or familiar toy to keep baby calm'],

  // Earthquake steps
  eq_home_1: ['立刻「趴下、掩護、抓緊」— 鑽到堅固桌子下，雙手護住頭頸', 'DROP, COVER, HOLD ON — Get under a sturdy table, protect head and neck'],
  eq_home_2: ['遠離窗戶、書架、吊燈、電視等易倒物品', 'Stay away from windows, bookshelves, lamps, TVs and things that can fall'],
  eq_home_3: ['搖晃停止後，穿鞋（地上有碎玻璃），確認家人安全', 'After shaking stops, put on shoes (broken glass), check family safety'],
  eq_home_4: ['關閉瓦斯總開關，檢查電器是否損壞', 'Turn off gas main, check for electrical damage'],
  eq_out_1: ['遠離建築物、電線桿、招牌。蹲在空曠處護頭', 'Move away from buildings, power lines, signs. Crouch in open area, protect head'],
  eq_out_2: ['若在開車：慢慢靠邊停車，留在車內等搖晃停止', 'If driving: slowly pull over, stay in car until shaking stops'],
  eq_out_3: ['若在山區：遠離山壁和懸崖，注意落石和土石流', 'In mountains: move away from cliffs, watch for landslides'],
  eq_out_4: ['搖晃停止後前往最近避難所或家庭集合點', 'After shaking stops, go to nearest shelter or family meeting point'],
  eq_after_1: ['注意餘震！大地震後數小時內可能有強烈餘震', 'Watch for aftershocks! Strong aftershocks possible for hours'],
  eq_after_2: ['不要進入受損建築物，即使是自己的家', 'Do not enter damaged buildings, even your own home'],
  eq_after_3: ['如果聞到瓦斯味，立刻離開、打開窗戶，到戶外再打電話', 'If you smell gas, leave immediately, open windows, call from outside'],
  eq_after_4: ['收聽 FM 廣播獲取政府最新指示（手機可能不通）', 'Listen to FM radio for government instructions (phones may be down)'],
  eq_after_5: ['不要散播未經證實的消息', 'Do not spread unverified information'],

  // Air raid steps
  air_1: ['立刻進入地下室、地下停車場、捷運站、或任何地下空間', 'Immediately enter basement, underground parking, MRT station, or any underground space'],
  air_2: ['若沒有地下空間：進入堅固建築低樓層（避開玻璃帷幕大樓），遠離窗戶', 'No underground space: enter sturdy building low floors (avoid glass curtain walls), stay from windows'],
  air_3: ['若在家中：到廁所或走廊（最內側無窗房間），坐在地上背靠牆', 'At home: go to bathroom or hallway (innermost windowless room), sit on floor against wall'],
  air_4: ['關閉門窗，拉上窗簾（減少玻璃碎片飛濺）', 'Close doors/windows, draw curtains (reduce glass shrapnel)'],
  air_5: ['打開收音機收聽官方廣播', 'Turn on radio for official broadcasts'],
  air_6: ['聽到「解除警報」（短音 30 秒）才能離開掩蔽處', 'Only leave shelter after "All Clear" signal (short tone 30 sec)'],
  air_7: ['不要相信社群媒體謠言，只信任政府官方管道', 'Do not trust social media rumors — only official government channels'],
  air_tip: ['平時就要記住：住家附近的地下停車場入口、最近的捷運站、堅固地下室在哪裡。', 'Know in advance: where the nearest underground parking entrance, MRT station, and sturdy basement are.'],

  // Fire steps
  fire_1: ['大喊「失火了！」通知同住者，同時按下住警器（如有）', 'Shout "FIRE!" to alert others, press fire alarm if available'],
  fire_2_apt: ['摸門把：不燙 → 低姿勢開門逃生；門燙 → 不要開門，用濕毛巾塞門縫，到窗邊等救援', 'Touch door handle: not hot → crouch and open; hot → do NOT open, stuff wet towel under door, wait at window'],
  fire_2_house: ['立刻從最近出口逃離，不嘗試滅火（除非極小範圍）', 'Exit through nearest door immediately, do not try to fight fire (unless very small)'],
  fire_3: ['低姿勢移動（煙在上方），用濕毛巾遮口鼻', 'Stay low (smoke rises), cover mouth/nose with wet towel'],
  fire_4: ['不搭電梯，走安全梯。下樓時沿右側靠牆', 'NO elevator — take stairs. Keep right side along wall going down'],
  fire_6: ['絕對不要回頭拿東西。人出來就好', 'NEVER go back for belongings. Get people out — that\'s all that matters'],

  // Typhoon steps
  ty_before_1: ['確認 72 小時緊急物資已備妥，特別是飲用水和手電筒', 'Confirm 72hr supplies ready, especially water and flashlights'],
  ty_before_2: ['把陽台、頂樓的所有物品移入室內（花盆會變致命武器）', 'Bring ALL balcony/rooftop items inside (flower pots become deadly projectiles)'],
  ty_before_3: ['用膠帶在窗戶貼「米」字型，減少碎裂飛散（或拉上鐵捲門）', 'Tape windows in asterisk pattern to reduce shattering (or close metal shutters)'],
  ty_before_4: ['充飽行動電源和所有手機', 'Fully charge power banks and all phones'],
  ty_before_5: ['將重要文件放入防水袋', 'Put important documents in waterproof bag'],
  ty_before_6: ['低窪地區：陸上警報發布後就撤離，不要等到水漲才走', 'Low-lying areas: evacuate after land warning issued — don\'t wait for flooding'],
  ty_during_1: ['待在室內，遠離窗戶。不要外出看風雨', 'Stay indoors, away from windows. Do NOT go outside to watch'],
  ty_during_2: ['如果窗戶破裂：立刻離開那個房間，關上房門擋風', 'If window breaks: leave that room immediately, close door to block wind'],
  ty_during_3: ['停電後：關閉所有電器的電源開關，防止回電時損壞', 'After power outage: turn off all appliance switches to prevent surge damage'],
  ty_during_4: ['如果開始淹水：切斷電源總開關（防觸電），往高處移動', 'If flooding starts: cut main power (prevent electrocution), move to higher ground'],
  ty_during_5: ['準備好緊急背包，隨時可能需要撤離到避難所', 'Keep go-bag ready — you may need to evacuate to shelter anytime'],
  ty_after_1: ['確認房屋結構安全才進入。注意天花板是否有水痕', 'Only enter building after confirming structural safety. Check ceiling for water marks'],
  ty_after_2: ['不要碰觸掉落的電線，通報 1911 台電服務專線', 'Do not touch fallen power lines — report to 1911 (Taiwan Power)'],
  ty_after_3: ['避開淹水區域（水中可能有漏電或汙水）', 'Avoid flooded areas (risk of electric shock and contaminated water)'],
  ty_after_4: ['清理積水防止登革熱孳生', 'Clean standing water to prevent dengue fever'],
  ty_after_5: ['拍照記錄房屋損壞情形，作為保險理賠依據', 'Photo-document damage for insurance claims'],

  // Apartment evacuation
  apt_1_pre: ['您住', 'You live on floor'],
  apt_1_post: ['樓。地震後走安全梯下樓，絕對不搭電梯', '. After earthquake, take stairs — NEVER elevator'],
  apt_2: ['開門前先用手背感覺門溫。門燙＝外面有火，留在室內等救援', 'Before opening door, feel temperature with back of hand. Hot = fire outside, stay inside and wait for rescue'],
  apt_3: ['低姿勢沿牆移動，用濕毛巾掩住口鼻避免吸入濃煙', 'Stay low along walls, cover mouth/nose with wet towel to avoid smoke'],
  apt_4: ['到達 1 樓後立刻離開建築物，不要在門口停留', 'Once at ground floor, leave building immediately — don\'t linger at entrance'],

  // Checklist items
  chk_water: ['飲用水', 'Drinking water'],
  chk_food_instant: ['即食食品（罐頭、餅乾、能量棒、巧克力）', 'Ready-to-eat food (canned, crackers, energy bars, chocolate)'],
  chk_food_rice: ['即食米飯或泡麵（不需開火可食用的）', 'Instant rice or noodles (edible without cooking)'],
  chk_utensils: ['免洗餐具和開罐器', 'Disposable utensils and can opener'],
  chk_firstaid: ['急救包（OK 繃、紗布、消毒液、剪刀）', 'First aid kit (bandages, gauze, disinfectant, scissors)'],
  chk_painkillers: ['止痛退燒藥、腸胃藥', 'Pain/fever medicine, stomach medicine'],
  chk_thermometer: ['體溫計', 'Thermometer'],
  chk_masks: ['口罩（每人 10 片以上）', 'Face masks (10+ per person)'],
  chk_saline: ['生理食鹽水', 'Saline solution'],
  chk_wipes: ['濕紙巾、衛生紙', 'Wet wipes, toilet paper'],
  chk_bags: ['垃圾袋（大型，可當臨時馬桶）', 'Large garbage bags (can serve as emergency toilet)'],
  chk_hygiene: ['個人衛生用品', 'Personal hygiene items'],
  chk_radio: ['手搖式或太陽能收音機（收聽 FM 廣播）', 'Hand-crank or solar radio (for FM broadcasts)'],
  chk_flashlight: ['手電筒 + 備用電池 × 2 組', 'Flashlight + 2 sets of spare batteries'],
  chk_powerbank: ['行動電源（已充飽，10000mAh 以上）', 'Power bank (fully charged, 10000mAh+)'],
  chk_whistle: ['哨子（每人一個，被困時求救）', 'Whistle (one per person, for rescue when trapped)'],
  chk_glowstick: ['螢光棒（夜間標示位置）', 'Glow sticks (mark position at night)'],
  chk_id: ['身分證 / 健保卡影本（每人）', 'Copy of ID / NHI card (per person)'],
  chk_bank: ['存摺、保險單影本', 'Copy of bank book, insurance policy'],
  chk_handbook: ['本手冊影本（特別是隨身卡頁）', 'Copy of this handbook (especially carry cards)'],
  chk_cash: ['現金小鈔 至少 NT$ 5,000', 'Cash in small bills, at least NT$5,000'],
  chk_waterproof: ['防水夾鏈袋（裝文件）', 'Waterproof zip bags (for documents)'],
  chk_clothes: ['換洗衣物（每人 3 天份）', 'Change of clothes (3 days per person)'],
  chk_jacket: ['保暖外套或毛毯', 'Warm jacket or blanket'],
  chk_gloves: ['工作手套 + 厚底鞋', 'Work gloves + sturdy shoes'],
  chk_knife: ['瑞士刀或多功能工具', 'Swiss army knife or multi-tool'],
  chk_rope: ['繩索 5 公尺', '5 meters of rope'],
  chk_fire: ['打火機或防水火柴', 'Lighter or waterproof matches'],

  // Reminders detail
  rem_gas: ['瓦斯總開關位置', 'Gas main valve location'],
  rem_power: ['電源總開關位置', 'Main power switch location'],
  rem_water: ['水表位置', 'Water meter location'],
  rem_extinguisher: ['滅火器位置', 'Fire extinguisher location'],
  rem_exit: ['逃生出口（安全梯）位置', 'Emergency exit (stairwell) location'],
  rem_manager: ['大樓管理員電話', 'Building manager phone'],
  rem_doctor: ['家庭醫師姓名 / 電話', 'Family doctor name / phone'],
  rem_insurance: ['保險公司 / 保單號碼', 'Insurance company / policy number'],
  rem_plate: ['車牌號碼', 'License plate number'],
  rem_pet_chip: ['寵物晶片號碼', 'Pet microchip number'],
  rem_other: ['其他', 'Other'],

  // Labels for bilingual address display in English mode
  label_addr: ['住址', 'Address'],
  label_meeting_point: ['集合點', 'Meeting Point'],
  label_age: ['年齡', 'Age'],
  label_medication: ['用藥', 'Medication'],
  label_allergy: ['過敏', 'Allergy'],
  label_chronic: ['慢性病', 'Chronic Illness'],
  label_mobility: ['特殊', 'Special Needs'],
  label_needs: ['需求', 'Needs'],
  label_emergency_contact: ['緊急聯絡', 'Emergency Contact'],
  label_emergency_phone: ['緊急電話', 'Emergency Numbers'],
  label_blood_type: ['血型', 'Blood Type'],
  label_born: ['年生', 'born'],
  label_years_old: ['歲', 'years old'],
  label_capacity: ['可容納', 'Capacity'],
  label_indoor: ['室內', 'Indoor'],
  label_applicable: ['適用災害', 'Applicable Disasters'],
  label_mgmt_phone: ['管理電話', 'Management Phone'],
  label_vulnerable: ['適合避難弱者（長者、身障者）安置', 'Suitable for vulnerable persons (elderly, disabled)'],
  label_hospital: ['醫院', 'Hospital'],
  label_clinic: ['診所', 'Clinic'],
  label_has_er: ['有急診', 'Has ER'],
  label_distance_from_home: ['距離住家', 'Distance from home'],
  label_nearest_medical: ['最近醫療機構', 'Nearest Medical Facility'],
  label_pets: ['家中有寵物', 'Pets at home'],
  label_has_yes: ['有', 'Yes'],
  label_mobility_impaired: ['行動不便', 'Mobility impaired'],
  label_raincoat: ['雨衣', 'Raincoats'],
  label_pcs: ['件', 'pcs'],
  label_person_份: ['人份', 'person(s)'],
  label_footer_handbook: ['家庭防災手冊', 'Family Emergency Handbook'],

  // Cover bilingual
  cover_bi_title: ['Family Emergency Handbook', 'Taiwan Family Emergency Handbook'],
}

export type BiMode = 'zh' | 'bi' | 'en'

/** Returns the appropriate text for the mode */
export function pt(mode: BiMode, key: string): string {
  const pair = TEXT[key]
  if (!pair) return key
  if (mode === 'en') return pair[1]
  return pair[0]
}

export function ptEn(key: string): string {
  const pair = TEXT[key]
  return pair ? pair[1] : ''
}
