document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ฐานข้อมูลและสถานะเกม ---
    const ACCOUNTS_DB = {
        "test1": { password: "test1" },
        "test2": { password: "test2" },
        "test3": { password: "test3" },
        "test4": { password: "test4" },
        "test5": { password: "test5" }
    };
    
    const userWallet = {
        "test1": 100000000,
        "test2": 100000000,
        "test3": 100000000,
        "test4": 100000000,
        "test5": 100000000
    };

    let currentUser = null;

    // --- *** ปรับปรุงส่วนนี้ (ความยาก) *** ---
    // ไอเทมที่สุ่มได้ (ปรับ Weight)
    const ITEMS = [
        // เพิ่มน้ำหนัก Junk ให้ออกง่ายขึ้น (จาก 10 เป็น 20)
        { name: 'Junk', symbol: '⚙️', class: 'item-junk', weight: 20 },
        // ลดน้ำหนัก Gold (จาก 5 เป็น 4)
        { name: 'Gold', symbol: '💰', class: 'item-gold', weight: 4 },
        // ลดน้ำหนัก Emerald (จาก 3 เป็น 2)
        { name: 'Emerald', symbol: '🟢', class: 'item-emerald', weight: 2 },
        // Ruby หายากเท่าเดิม
        { name: 'Ruby', symbol: '💎', class: 'item-ruby', weight: 1 } 
    ];
    // --- จบส่วนปรับปรุง ---


    // --- 2. DOM Elements (เหมือนเดิม) ---
    const loginContainer = document.getElementById('login-container');
    const gameContainer = document.getElementById('game-container');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const welcomeMessage = document.getElementById('welcome-message');
    const goldDisplay = document.getElementById('gold-display');
    const logoutButton = document.getElementById('logout-button');
    const chest1 = document.getElementById('chest1');
    const chest2 = document.getElementById('chest2');
    const chest3 = document.getElementById('chest3');
    const betInput = document.getElementById('bet-input');
    const openButton = document.getElementById('open-button');
    const resultMessage = document.getElementById('result-message');


    // --- 3. ฟังก์ชันหลัก (มีการเปลี่ยนแปลง) ---

    function updateGoldDisplay() {
        if (currentUser) {
            goldDisplay.textContent = `ทอง: ${userWallet[currentUser].toLocaleString()}`;
        }
    }

    function handleLogin() {
        // (ฟังก์ชันนี้เหมือนเดิม)
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

    function handleLogout() {
        // (ฟังก์ชันนี้เหมือนเดิม)
        currentUser = null;
        loginContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
    }

    function getRandomItem() {
        // (ฟังก์ชันนี้เหมือนเดิม แต่ผลลัพธ์จะเปลี่ยนไปตาม Weight ที่เราแก้)
        const weightedList = [];
        ITEMS.forEach(item => {
            for (let i = 0; i < item.weight; i++) {
                weightedList.push(item);
            }
        });
        
        const randomIndex = Math.floor(Math.random() * weightedList.length);
        return weightedList[randomIndex];
    }

    function handleOpenChest() {
        const betAmount = parseInt(betInput.value, 10);

        if (isNaN(betAmount) || betAmount <= 0) {
            resultMessage.textContent = 'กรุณาใส่ค่ากุญแจที่ถูกต้อง';
            return;
        }
        if (userWallet[currentUser] < betAmount) {
            resultMessage.textContent = 'คุณมีทองไม่เพียงพอ!';
            return;
        }

        openButton.disabled = true;
        resultMessage.textContent = 'กำลังเปิดหีบ...';
        resultMessage.className = ''; // ล้างสีข้อความ

        userWallet[currentUser] -= betAmount;
        updateGoldDisplay();

        const results = [getRandomItem(), getRandomItem(), getRandomItem()];
        const chests = [chest1, chest2, chest3];
        
        // --- *** เพิ่มส่วนนี้ (อนิเมชั่น) *** ---
        // เพิ่ม class 'spinning'
        chests.forEach(chest => {
            chest.textContent = '❓';
            chest.className = 'chest'; // Reset class
            chest.classList.add('spinning'); // เริ่มหมุน
        });
        // --- จบส่วนเพิ่ม ---

        setTimeout(() => {
            // --- *** เพิ่มส่วนนี้ (อนิเมชั่น) *** ---
            // ลบ class 'spinning'
            chests.forEach((chest, index) => {
                chest.classList.remove('spinning'); // หยุดหมุน
                // --- จบส่วนเพิ่ม ---
                
                // แสดงผลลัพธ์ (เหมือนเดิม)
                const item = results[index];
                chest.textContent = item.symbol;
                chest.classList.add(item.class);
            });

            checkWinnings(results, betAmount);
            openButton.disabled = false;
        }, 1000); // หน่วงเวลา 1 วินาที (เวลาหมุน)
    }


    // --- *** ปรับปรุงส่วนนี้ (ลดเงินรางวัล) *** ---
    /**
     * ตรวจสอบรางวัลและจ่ายโบนัส (ลดเงินรางวัล)
     */
    function checkWinnings(results, betAmount) {
        const [r1, r2, r3] = results;

        let bonus = 0;
        let message = '';
        resultMessage.className = ''; // ล้าง class

        // 3-of-a-kind (เหมือนกัน 3 ช่อง) - ลดรางวัลลง
        if (r1.name === r2.name && r2.name === r3.name) {
            if (r1.name === 'Ruby') bonus = betAmount * 50;  // (จาก * 100)
            else if (r1.name === 'Emerald') bonus = betAmount * 25; // (จาก * 50)
            else if (r1.name === 'Gold') bonus = betAmount * 10;    // (จาก * 20)
            else bonus = betAmount * 2;     // (Junk, จาก * 5)

            message = `แจ็คพอต! ได้ ${r1.name} 3 อัน! +${bonus.toLocaleString()} ทอง!`;
            resultMessage.classList.add('win-message');
        }
        // 2-of-a-kind (เหมือนกัน 2 ช่อง) - ลดรางวัลลง
        else if (r1.name === r2.name || r2.name === r3.name || r1.name === r3.name) {
            bonus = betAmount * 1.5; // (จาก * 2) ได้คืน 1.5 เท่า
            message = `ได้ 2 อัน! +${bonus.toLocaleString()} ทอง!`;
            resultMessage.classList.add('win-message');
        }
        // ไม่ได้รางวัล
        else {
            message = 'ไม่ได้รางวัลเลย ลองใหม่อีกครั้ง!';
            resultMessage.classList.add('lose-message');
        }

        if (bonus > 0) {
            userWallet[currentUser] += bonus;
        }

        resultMessage.textContent = message;
        updateGoldDisplay();
    }
    // --- จบส่วนปรับปรุง ---


    // --- 4. Event Listeners (เหมือนเดิม) ---
    loginButton.addEventListener('click', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    openButton.addEventListener('click', handleOpenChest);
    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });

});
