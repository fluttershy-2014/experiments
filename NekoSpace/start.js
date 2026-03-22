export class StartMenu {
    constructor(onStart) {
        this.onStart = onStart;
        this.createMenu();
    }

    createMenu() {
        const menu = document.createElement('div');
        menu.id = 'start-menu';
        menu.style = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 2, 5, 0.9);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            z-index: 100; color: #ff99cc; font-family: 'Segoe UI', sans-serif;
            text-align: center; transition: opacity 0.5s;
        `;

        menu.innerHTML = `
            <h1 style="font-size: 60px; text-shadow: 0 0 20px #ff0066; margin-bottom: 10px;">
                🐾 NEKO SPACE: Reach the Stars! 🐾
            </h1>
            <h2 style="color: #fff; margin-bottom: 30px; letter-spacing: 2px;">500 SUSHI DASH</h2>
            
            <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 15px; border: 1px solid #ff99cc; margin-bottom: 40px;">
                <p style="font-size: 20px; color: #fff;"><b>ЦЕЛЬ:</b> Собрать 500 легендарных суши в космическом саду.</p>
                <p style="font-size: 18px; color: #ff99cc;">Остерегайся падений! Используй чекпоинты (красные плиты).</p>
                <p style="font-size: 16px; color: #aaa; margin-top: 10px;">Управление: WASD + Мышь + Пробел</p>
            </div>

            <button id="start-button" style="
                padding: 15px 40px; font-size: 24px; background: #ff0066; color: #fff;
                border: none; border-radius: 50px; cursor: pointer;
                box-shadow: 0 0 15px #ff0066; font-weight: bold; transition: 0.3s;
            ">
                НАЧАТЬ СОБИРАТЬ СУШИ
            </button>
        `;

        document.body.appendChild(menu);

        const btn = document.getElementById('start-button');
        btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
        
        btn.onclick = () => {
            menu.style.opacity = '0';
            setTimeout(() => {
                menu.remove();
                this.onStart(); // Запускаем игру и музыку
            }, 500);
        };
    }
}