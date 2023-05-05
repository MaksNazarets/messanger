import { PopUpMessage } from "./PopUpMessage.js"

export class PremiumWindow {
    private wrapper: HTMLElement;
    constructor(private user: { id: number, has_premium: boolean }, private parentEl: HTMLElement) {
        this.user = user;
        this.wrapper = document.createElement('div');
    }

    show = () => {
        if (this.user.has_premium) {
            new PopUpMessage('Дякуємо за покупку преміуму :)').show();
            return false;
        }
        else {
            const premiumFeatures: string[] = [
                'Можливість надсилання медіа-коненту та файлів',
                'Можливість змінювати фон чату',
                'Відмітку преміум-користувача',
            ];

            this.wrapper = document.createElement('div');
            this.wrapper.className = 'premium-info-window';

            const heading = document.createElement('h2');
            heading.textContent = 'Стань преміум користувачем і отримай:';

            const list = document.createElement('ul');

            premiumFeatures.map(feature => {
                const item = document.createElement('li');
                item.textContent = feature;
                list.appendChild(item);
            })

            const button = document.createElement('button');
            button.textContent = 'Отримати переміум статус';

            button.onclick = () => {
                console.log('hello');
                this.wrapper.innerHTML = '';
                const form = document.createElement('form');
                form.classList.add('bank-card-form');
                form.setAttribute('name', 'creditCardForm');

                const labelCardNumber = document.createElement('label');
                labelCardNumber.setAttribute('for', 'cardNumber');
                labelCardNumber.textContent = 'Номер картки:';

                const inputCardNumber = document.createElement('input');
                inputCardNumber.setAttribute('type', 'text');
                inputCardNumber.setAttribute('id', 'cardNumber');
                inputCardNumber.setAttribute('name', 'cardNumber');
                inputCardNumber.setAttribute('placeholder', '1234 5678 9101 1234');

                inputCardNumber.oninput = (event) => {
                    if (inputCardNumber.value.length > 19) {
                        inputCardNumber.value = inputCardNumber.value.slice(0, -1);
                        return;
                    }

                    const trimmedValue = inputCardNumber.value.replace(/\s+/g, ''); // remove any existing spaces
                    const numericValue = trimmedValue.replace(/\D/g, ''); // remove any non-numeric characters
                    const spacedValue = numericValue.replace(/(\d{4})/g, '$1 '); // add a space after every four digits
                    inputCardNumber.value = spacedValue.trim(); // update the input value with the formatted value
                };

                const labelExpYear = document.createElement('label');
                labelExpYear.setAttribute('for', 'expYear');
                labelExpYear.textContent = 'Термін дії:';

                const divExpDate = document.createElement('div');
                divExpDate.classList.add('exp-date');

                const inputExpMonth = document.createElement('input');
                inputExpMonth.setAttribute('type', 'number');
                inputExpMonth.setAttribute('id', 'expMonth');
                inputExpMonth.setAttribute('name', 'expMonth');
                inputExpMonth.setAttribute('placeholder', 'місяць');

                inputExpMonth.oninput = (event) => {
                    if (inputExpMonth.value.length > 2) {
                        inputExpMonth.value = inputExpMonth.value.slice(0, -1);
                        inputExpYear.focus();
                        return;
                    }
                }

                const inputExpYear = document.createElement('input');
                inputExpYear.setAttribute('type', 'number');
                inputExpYear.setAttribute('id', 'expYear');
                inputExpYear.setAttribute('name', 'expYear');
                inputExpYear.setAttribute('placeholder', 'рік');

                inputExpYear.oninput = (event) => {
                    if (inputExpYear.value.length > 2) {
                        inputExpYear.value = inputExpYear.value.slice(0, -1);
                        inputCvv.focus();
                        return;
                    }
                }

                const labelCvv = document.createElement('label');
                labelCvv.setAttribute('for', 'cvv');
                labelCvv.textContent = 'CVV-код:';

                const inputCvv = document.createElement('input');
                inputCvv.setAttribute('type', 'text');
                inputCvv.setAttribute('id', 'cvv');
                inputCvv.setAttribute('name', 'cvv');
                inputCvv.setAttribute('placeholder', '123');

                inputCvv.oninput = (event) => {
                    if (inputCvv.value.length > 3) {
                        inputCvv.value = inputCvv.value.slice(0, -1);
                        return;
                    }
                }

                const button = document.createElement('button');
                button.setAttribute('type', 'submit');
                button.textContent = 'Оплатити';

                divExpDate.appendChild(inputExpMonth);
                divExpDate.appendChild(inputExpYear);

                form.appendChild(labelCardNumber);
                form.appendChild(inputCardNumber);
                form.appendChild(labelExpYear);
                form.appendChild(divExpDate);
                form.appendChild(labelCvv);
                form.appendChild(inputCvv);
                form.appendChild(button);

                form.onsubmit = (e) => {
                    e.preventDefault();

                    const monthInt = parseInt(inputExpMonth.value);
                    const shortYearInt = parseInt(inputExpYear.value);

                    [inputCardNumber, inputExpMonth, inputExpYear, inputCvv].map(inp => {
                        if (inp.value.length === 0) {
                            new PopUpMessage('Заповніть всі поля').show();
                            return;
                        }
                    })

                    if (inputCardNumber.value.length < 19) {
                        new PopUpMessage('Некоректний номер картки').show();
                        return;
                    }
                    else if (monthInt < 1 || monthInt > 12) {
                        new PopUpMessage('Некоректний місяць закічення терміну дії картки').show();
                        return;
                    }
                    else if (shortYearInt < parseInt(new Date().getFullYear().toString().slice(-2))) {
                        new PopUpMessage('Некоректний рік закічення терміну дії картки').show();
                        return;
                    }
                    else if (monthInt < new Date().getMonth() && shortYearInt == parseInt(new Date().getFullYear().toString().slice(-2))) {
                        new PopUpMessage('Термін дії картки минув').show();
                        return;
                    }
                    else if (parseInt(inputCvv.value) < 100) {
                        new PopUpMessage('Некоректний CVV-код').show();
                        return;
                    }

                    fetch('/process-premium-status-query', {
                        method: 'POST',
                        body: new FormData(form)
                    })
                        .then(response => response.json())
                        .then(data => {
                            this.hide()
                            if (data.status === 'success')
                                new PopUpMessage('Дякуємо за покупку преміуму!').show();
                            else
                                new PopUpMessage('Не вдалося стягнути кошти :(').show();
                        })
                        .catch(error => console.log(error));
                }

                this.wrapper.appendChild(form);
            }

            this.wrapper.appendChild(heading);
            this.wrapper.appendChild(list);
            this.wrapper.appendChild(button);

            this.parentEl.appendChild(this.wrapper);
            return true;
        }
    }

    hide = () => {
        this.parentEl.removeChild(this.wrapper);
    }
}