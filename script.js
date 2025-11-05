// รอให้ HTML โหลดเสร็จก่อน
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ฐานข้อมูลและสถานะเกม ---

    // ฐานข้อมูล Account (รหัสผ่านควรถูก hash ในโลกจริง)
    const ACCOUNTS_DB = {
        "test1": { password: "test1" },
        "test2": { password: "test2" },
        "test3": { password: "test3" },
        "test4": { password: "test4" }, // เพิ่ม 2 account ตามที่ขอ
        "test5": { password: "test5" }
    };

    // ฐานข้อมูลเงินในเกม (แยกเก็บเพื่อให้อัปเดตได้)
    const userWallet = {
        "test1": 100000000, // 100M
        "test2": 100000000,
        "test3": 100000000,
        "test4": 100000000,
        "test5": 100000000
    };

    // สถานะของแอป
    let currentUser = null;

    // ไอเทมที่สุ่มได้
    const ITEMS = [
        { name: 'Junk', symbol: '⚙️', class: 'item-junk', weight: 10 },
        { name: 'Gold', symbol: '💰', class: 'item-gold', weight: 5 },
        { name: 'Emerald', symbol: '🟢', class: 'item-emerald', weight: 3 },
        { name: 'Ruby', symbol: '💎', class: 'item-ruby', weight: 1 } // หายากสุด
    ];

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


    // --- 3. ฟังก์ชันหลัก ---

    /**
     * อัปเดตยอดเงินที่แสดงบน UI
     */
    function updateGoldDisplay() {
        if (currentUser) {
            goldDisplay.textContent = `ทอง: ${userWallet[currentUser].toLocaleString()}`;
        }
    }

    /**
     * จัดการการ Login
     */
    function handleLogin() {
        const username = usernameInput.value;
        const password = passwordInput.value;

        // ตรวจสอบว่ามี user นี้ใน DB และรหัสผ่านตรงกันหรือไม่
        if (ACCOUNTS_DB[username] && ACCOUNTS_DB[username].password === password) {
            // Login สำเร็จ
            currentUser = username;
            loginError.textContent = '';
            usernameInput.value = '';
            passwordInput.value = '';

            // แสดงหน้าเกม
            loginContainer.classList.add('hidden');
            gameContainer.classList.remove('hidden');

            // ตั้งค่าหน้าเกม
            welcomeMessage.textContent = `ยินดีต้อนรับ, ${currentUser}`;
            updateGoldDisplay();

        } else {
            // Login ไม่สำเร็จ
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
        // สร้าง mWeighted List
        const weightedList = [];
        ITEMS.forEach(item => {
            for (let i = 0; i < item.weight; i++) {
                weightedList.push(item);
            }
        });
        
        // สุ่มจาก List ที่มีน้ำหนักแล้ว
        const randomIndex = Math.floor(Math.random() * weightedList.length);
        return weightedList[randomIndex];
    }

    /**
     * จัดการการเปิดหีบ (การ "หมุน")
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

        // ล็อกปุ่มกันกดซ้ำ
        openButton.disabled = true;
        resultMessage.textContent = 'กำลังเปิดหีบ...';

        // 1. หักเงิน
        userWallet[currentUser] -= betAmount;
        updateGoldDisplay();

        // 2. สุ่มผลลัพธ์
        const results = [getRandomItem(), getRandomItem(), getRandomItem()];
        
        // อนิเมชั่นเล็กน้อย (จำลองการหมุน)
        const chests = [chest1, chest2, chest3];
        chests.forEach(chest => {
            chest.textContent = '❓';
            chest.className = 'chest'; // Reset class
        });

        setTimeout(() => {
            // 3. แสดงผลลัพธ์
            results.forEach((item, index) => {
                chests[index].textContent = item.symbol;
                chests[index].classList.add(item.class);
            });

            // 4. ตรวจสอบรางวัล
            checkWinnings(results, betAmount);

            // 5. ปลดล็อกปุ่ม
            openButton.disabled = false;
        }, 1000); // หน่วงเวลา 1 วินาที
    }

    /**
     * ตรวจสอบรางวัลและจ่ายโบนัส
     */
    function checkWinnings(results, betAmount) {
        const [r1, r2, r3] = results;

        let bonus = 0;
        let message = '';

        // 3-of-a-kind (เหมือนกัน 3 ช่อง)
        if (r1.name === r2.name && r2.name === r3.name) {
            if (r1.name === 'Ruby') bonus = betAmount * 100; // รางวัลใหญ่สุด
            else if (r1.name === 'Emerald') bonus = betAmount * 50;
            else if (r1.name === 'Gold') bonus = betAmount * 20;
            else bonus = betAmount * 5; // Junk 3 อัน

            message = `แจ็คพอต! ได้ ${r1.name} 3 อัน! +${bonus.toLocaleString()} ทอง!`;
        }
        // 2-of-a-kind (เหมือนกัน 2 ช่อง)
        else if (r1.name === r2.name || r2.name === r3.name || r1.name === r3.name) {
            bonus = betAmount * 2; // ได้ทุนคืน x2
            message = `ได้ 2 อัน! +${bonus.toLocaleString()} ทอง!`;
        }
        // ไม่ได้รางวัล
        else {
            message = 'ไม่ได้รางวัลเลย ลองใหม่อีกครั้ง!';
        }

        // จ่ายโบนัส (ถ้ามี)
        if (bonus > 0) {
            userWallet[currentUser] += bonus;
        }

        // อัปเดต UI
        resultMessage.textContent = message;
        updateGoldDisplay();
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
