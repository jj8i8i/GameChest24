document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ฐานข้อมูลและสถานะเกม ---

    // ฐานข้อมูล Account
    const ACCOUNTS_DB = {
        "test1": { password: "test1" },
        "test2": { password: "test2" },
        "test3": { password: "test3" },
        "test4": { password: "test4" },
        "test5": { password: "test5" }
    };
    
    // ฐานข้อมูลเงินในเกม
    const userWallet = {
        "test1": 100000000, // 100M
        "test2": 100000000,
        "test3": 100000000,
        "test4": 100000000,
        "test5": 100000000
    };

    let currentUser = null;

    // --- *** นี่คือส่วนที่แก้ไขแล้ว (อัปเดตลิงก์ Postimg) *** ---
    const ITEMS = [
        // Tier 1: Common (Junk) - (อันดับ 3)
        { 
            name: 'ตัวละคร Common', 
            imageUrl: 'https://i.postimg.cc/zG9NcHTm/1762349812302.jpg', // <-- รูปที่ 3
            weight: 20 
        },
        // Tier 2: Uncommon - (อันดับ 3)
        { 
            name: 'ตัวละคร Uncommon', 
            imageUrl: 'https://i.postimg.cc/zG9NcHTm/1762349812302.jpg', // <-- รูปที่ 3
            weight: 4 
        },
        // Tier 3: Rare - (อันดับ 2)
        { 
            name: 'ตัวละคร Rare', 
            imageUrl: 'https://i.postimg.cc/XYhN6z66/1762349639110.jpg', // <-- รูปที่ 2
            weight: 2 
        },
        // Tier 4: Legendary - (อันดับ 1)
        { 
            name: 'ตัวละคร Legendary', 
            imageUrl: 'https://i.postimg.cc/QCrHGn7P/1762349786753.jpg', // <-- รูปที่ 1
            weight: 1 
        }
    ];
    // --- จบส่วนที่แก้ไข ---


    // --- 2. DOM Elements (ตัวแปรเชื่อม HTML) ---
    const loginContainer = document.getElementById('login-container');
    const gameContainer = document.getElementById('game-container');
    
    // Login
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');

    // Game
    const welcomeMessage = document.getElementById('welcome-message');
    const goldDisplay = document.getElementById('gold-display');
    const logoutButton = document.getElementById('logout-button');
    const chest1 = document.getElementById('chest1');
    const chest2 = document.getElementById('chest2');
    const chest3 = document.getElementById('chest3');
    const betInput = document.getElementById('bet-input');
    const openButton = document.getElementById('open-button');
    const resultMessage = document.getElementById('result-message');

    // Audio
    const audioSpin = document.getElementById('audio-spin');
    const audioWin = document.getElementById('audio-win');
    const audioLose = document.getElementById('audio-lose');
    const audioReveal = document.getElementById('audio-reveal');


    // --- 3. ฟังก์ชันหลัก ---

    /**
     * อัปเดตยอดเงินที่แสดงบน UI (เพิ่ม-ลบ อนิเมชั่น)
     */
    function updateGoldDisplay(didWin = false) {
        if (currentUser) {
            goldDisplay.textContent = `ทอง: ${userWallet[currentUser].toLocaleString()}`;
            
            // ถ้าชนะ ให้ใส่ class 'gold-flash'
            if (didWin) {
                goldDisplay.classList.add('gold-flash');
                setTimeout(() => {
                    goldDisplay.classList.remove('gold-flash');
                }, 700); // 0.7s ตรงกับเวลาอนิเมชั่น
            }
        }
    }

    /**
     * จัดการการ Login
     */
    function handleLogin() {
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (ACCOUNTS_DB[username] && ACCOUNTS_DB[username].password === password) {
            currentUser = username;
            loginError.textContent = '';
            usernameInput.value = '';
            passwordInput.value = '';

            loginContainer.classList.add('hidden');
            gameContainer.classList.remove('hidden');

            welcomeMessage.textContent = `ยินดีต้อนรับ, ${currentUser}`;
            updateGoldDisplay();

        } else {
            loginError.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        }
    }

    /**
     * จัดการการ Logout
     */
    function handleLogout() {
        currentUser = null;
        loginContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
    }

    /**
     * สุ่มไอเทมโดยใช้น้ำหนัก (Weight)
     */
    function getRandomItem() {
        const weightedList = [];
        ITEMS.forEach(item => {
            for (let i = 0; i < item.weight; i++) {
                weightedList.push(item);
            }
        });
        
        const randomIndex = Math.floor(Math.random() * weightedList.length);
        return weightedList[randomIndex];
    }

    /**
     * ฟังก์ชันช่วยในการเปิดหีบทีละช่อง (แสดงผลเป็นรูปภาพ)
     */
    function revealChest(chestElement, item) {
        chestElement.classList.remove('spinning'); // หยุดหมุน
        
        // ใส่รูปภาพลงในหีบ
        chestElement.innerHTML = `<img src="${item.imageUrl}" alt="${item.name}">`;

        chestElement.textContent = ''; // ล้าง '❓' ที่อาจค้างอยู่
        audioReveal.currentTime = 0;
        audioReveal.play(); // เล่นเสียง "เปิด"
    }

    /**
     * จัดการการเปิดหีบ (การ "หมุน" และ เปิดเรียง 1-2-3)
     */
    function handleOpenChest() {
        const betAmount = parseInt(betInput.value, 10);

        // ตรวจสอบเงื่อนไข
        if (isNaN(betAmount) || betAmount <= 0) {
            resultMessage.textContent = 'กรุณาใส่ค่ากุญแจที่ถูกต้อง';
            return;
        }
        if (userWallet[currentUser] < betAmount) {
            resultMessage.textContent = 'คุณมีทองไม่เพียงพอ!';
            return;
        }

        // 1. ล็อกปุ่ม, หักเงิน, เริ่มเสียง
        openButton.disabled = true;
        resultMessage.textContent = 'กำลังเปิดหีบ...';
        resultMessage.className = '';
        audioSpin.currentTime = 0;
        audioSpin.play(); // เล่นเสียง "หมุน"

        userWallet[currentUser] -= betAmount;
        updateGoldDisplay(false); // อัปเดตเงิน (ไม่ flash)

        // 2. สุ่มผลลัพธ์
        const results = [getRandomItem(), getRandomItem(), getRandomItem()];
        const chests = [chest1, chest2, chest3];

        // 3. เริ่มหมุนทุกช่อง (รีเซ็ตเป็น '❓')
        chests.forEach(chest => {
            chest.innerHTML = ''; // ล้างรูปเก่า
            chest.textContent = '❓'; // ใส่ '❓' กลับมา
            chest.className = 'chest';
            chest.classList.add('spinning');
        });

        // 4. เปิดเรียงลำดับ
        // เปิดช่อง 1 (หลัง 0.7 วินาที)
        setTimeout(() => {
            revealChest(chests[0], results[0]);
        }, 700);

        // เปิดช่อง 2 (หลัง 1.4 วินาที)
        setTimeout(() => {
            revealChest(chests[1], results[1]);
        }, 1400);

        // เปิดช่อง 3 (หลัง 2.1 วินาที)
        setTimeout(() => {
            revealChest(chests[2], results[2]);
        }, 2100);

        // 5. ตรวจสอบผลลัพธ์ (หลัง 2.5 วินาที)
        setTimeout(() => {
            audioSpin.pause(); // หยุดเสียงหมุน
            checkWinnings(results, betAmount);
            openButton.disabled = false; // ปลดล็อกปุ่ม
        }, 2500); 
    }

    /**
     * ตรวจสอบรางวัลและจ่ายโบนัส (เพิ่มเสียงและอนิเมชั่น)
     */
    function checkWinnings(results, betAmount) {
        const [r1, r2, r3] = results.map(item => item.name); // เอาแค่ชื่อ
        const chests = [chest1, chest2, chest3];

        let bonus = 0;
        let message = '';
        resultMessage.className = ''; 

        // 3-of-a-kind (เหมือนกัน 3 ช่อง)
        if (r1 === r2 && r2 === r3) {
            // อัปเดตชื่อตาม ITEMS ใหม่
            if (r1 === 'ตัวละคร Legendary') bonus = betAmount * 50;
            else if (r1 === 'ตัวละคร Rare') bonus = betAmount * 25;
            else if (r1 === 'ตัวละคร Uncommon') bonus = betAmount * 10;
            else bonus = betAmount * 2; // Common

            message = `แจ็คพอต! ได้ ${r1} 3 อัน! +${bonus.toLocaleString()} ทอง!`;
            // อนิเมชั่นช่องที่ชนะ
            chests.forEach(c => c.classList.add('win-pop'));
        }
        // 2-of-a-kind (เหมือนกัน 2 ช่อง)
        else if (r1 === r2 || r2 === r3 || r1 === r3) {
            bonus = betAmount * 1.5;
            message = `ได้ 2 อัน! +${bonus.toLocaleString()} ทอง!`;
            
            // อนิเมชั่นช่องที่ชนะ
            if (r1 === r2) [chests[0], chests[1]].forEach(c => c.classList.add('win-pop'));
            if (r2 === r3) [chests[1], chests[2]].forEach(c => c.classList.add('win-pop'));
            if (r1 === r3) [chests[0], chests[2]].forEach(c => c.classList.add('win-pop'));
        }
        // ไม่ได้รางวัล
        else {
            message = 'ไม่ได้รางวัลเลย ลองใหม่อีกครั้ง!';
        }

        // จ่ายโบนัส / เล่นเสียง
        if (bonus > 0) {
            userWallet[currentUser] += bonus;
            audioWin.play(); // เล่นเสียง "ชนะ"
            updateGoldDisplay(true); // อัปเดตเงิน (มี flash)
            resultMessage.classList.add('win-message');
        } else {
            audioLose.play(); // เล่นเสียง "แพ้"
            resultMessage.classList.add('lose-message');
        }

        resultMessage.textContent = message;

        // ล้างอนิเมชั่น 'win-pop' ออกหลัง 0.5 วินาที
        setTimeout(() => {
            chests.forEach(c => c.classList.remove('win-pop'));
        }, 500);
    }

    // --- 4. Event Listeners (เชื่อมปุ่มกับฟังก์ชัน) ---
    loginButton.addEventListener('click', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    openButton.addEventListener('click', handleOpenChest);

    // ทำให้กด Enter ที่ช่อง password เพื่อ login ได้
    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });

});
