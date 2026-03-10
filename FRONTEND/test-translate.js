import translate from 'google-translate-api-x';

translate(['Ik spreek Engels', 'Hoe gaat het?'], {to: 'en'}).then(res => {
    console.log(res.map(r => r.text));
}).catch(err => {
    console.error("Error:", err);
});
