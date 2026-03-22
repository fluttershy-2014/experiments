export class Ending {
    constructor(onRestart) {
        this.onRestart = onRestart;
        this.element = this.createUI();
    }

    createUI() {
        const div = document.createElement('div');
        div.id = 'victory-screen';
        div.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85); display: none;
            flex-direction: column; align-items: center; justify-content: center;
            z-index: 100; color: #ff99cc; font-family: 'Segoe UI', sans-serif;
            text-align: center; backdrop-filter: blur(10px);
        `;

        div.innerHTML = `
            <h1 style="font-size: 60px; text-shadow: 0 0 20px #ff0066; margin: 0;">МИССИЯ ВЫПОЛНЕНА! 🐾</h1>
            <p style="font-size: 24px; color: #fff; margin: 20px 0;">Вы собрали все суши! Неко очень довольна и сыта (ня!)</p>
            <button id="retry-btn" style="
                margin-top: 20px; padding: 15px 40px; font-size: 22px;
                background: #ff0066; color: white; border: none; border-radius: 50px;
                cursor: pointer; box-shadow: 0 0 15px #ff0066; transition: 0.3s;
            ">НАЧАТЬ ЗАНОВО</button>
        `;

        document.body.appendChild(div);

        div.querySelector('#retry-btn').onclick = () => {
            this.hide();
            this.onRestart();
        };

        return div;
    }

    show() {
        this.element.style.display = 'flex';
        document.exitPointerLock(); // Выходим из режима мыши, чтобы нажать кнопку
    }

    hide() {
        this.element.style.display = 'none';
    }
}