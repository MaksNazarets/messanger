export class PopUpMessage {
    constructor(private text: string) {
        this.text = text;
    }

    show = () => {
        const container = document.createElement('div');
        container.className = 'pop-up-message';
        container.innerText = this.text;
        document.body.appendChild(container);

        const animationIn = container.animate(
            [
                { transform: "translate(-50%, 220%)", opacity: '0' },
                { transform: "translate(-50%, 200%)", opacity: '1' },
            ],
            {
                duration: 200,
                fill: "forwards"
            }
        );

        animationIn.onfinish = () => {
            setTimeout(() => {
                const animationOut = container.animate(
                    [
                        { transform: "translate(-50%, 200%)", opacity: '1' },
                        { transform: "translate(-50%, 0)", opacity: '0' },
                    ],
                    {
                        duration: 1000,
                        fill: "forwards"
                    }
                );

                animationOut.onfinish = () => {
                    document.body.removeChild(container)
                }
            }, 2000);
        }
    }
}