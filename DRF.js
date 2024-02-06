function clearForm() {
    const form = document.getElementById('forgotnvrpinForm');
    const input1 = document.getElementById('proofOfPurchase');
    const input2 = document.getElementById('systemInfo');
    const input3 = document.getElementById('stickerLabel');
    const previewContainer1 = document.getElementById('imagePreview1');
    const previewContainer2 = document.getElementById('imagePreview2');
    const previewContainer3 = document.getElementById('imagePreview3');
    form.reset();
    input1.value = '';
    input2.value = '';
    input3.value = '';
    previewContainer1.innerHTML = '';
    previewContainer2.innerHTML = '';
    previewContainer3.innerHTML = '';
}

function previewImages(inputId, previewContainerId) {
    const input = document.getElementById(inputId);
    const previewContainer = document.getElementById(previewContainerId);
    previewContainer.innerHTML = '';
    for (const file of input.files) {
        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds the limit (5 MB). Please choose a smaller file.');
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-image';
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

class forgotNVRPin {
    initialize() {
        this.loadItems();
    }

    loadItems = () => {
        const params = {
            ACCESS_TOKEN: getCookie("ACCESS_TOKEN"),
            REFRESH_TOKEN: getCookie("REFRESH_TOKEN"),
            ID_TOKEN: getCookie("ID_TOKEN"),
        };

        if (params.ID_TOKEN) {
            const hiddenField = document.getElementById("idToken");
            if (hiddenField) {
                hiddenField.value = params.ID_TOKEN;
            }
        }

        let url = new URL("https://www.lorex.com/tools/proxy-app/warranties");
        Object.keys(params).forEach((key) =>
            url.searchParams.append(key, params[key])
        );

        fetch(url, { ...fetchConfig("json", "GET") })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Something went wrong");
                }
            })
            .then((parsedState) => {
                if (parsedState && parsedState.accessToken)
                    Cookies.set(`ACCESS_TOKEN`, `${parsedState.accessToken}`);

                if (parsedState.warranties.length > 0) {
                    document.getElementById("forgotNvrPinSection").style.display = "block";
                    document.querySelector("warranty_list .content").innerHTML = this.renderItems(
                        parsedState.warranties);
                } else {
                    document.getElementById("forgotNvrPinSection").style.display = "none";
                    document.getElementById("warrantyMessage").style.display = "block";
                }
            })
            .catch((_error) => {
                console.log(_error);
                document.querySelector("warranty_list .content").innerHTML = `<p>You have no activated warranties at this time. </p>`;
            });
    };

    renderItems = (items) => {
        let html = ""
        for (const item of items) {
            html += `
        <warranty_item>
          <div>
            <div>Model No:</div>
            <div>${item.model}</div>
          </div>
          <div>
            <div>Term:</div>
            <div>1 year</div>
          </div>
          <div>
            <div>Date:</div>
            <div>${item.date}</div>
          </div>
        </warranty_item>
      `
        }
        console.log(html)
        return html
    }
}

document.addEventListener('DOMContentLoaded', function () {
    new forgotNVRPin().initialize();
    $('.select2').select2();
});

$('form').submit(function (e) {
    e.preventDefault();
    showLoadingScreen();
    const formData = new FormData();
    formData.append('firstName', $('#firstName').val());
    formData.append('lastName', $('#lastName').val());
    formData.append('phoneNumber', $('#phoneNumber').val());
    formData.append('modelNumber', $('#modelNumber').val());
    formData.append('deviceID', $('#deviceID').val());
    formData.append('serialNumber', $('#serialNumber').val());
    formData.append('dateDevice', $('#dateDevice').val());
    formData.append('proofOfPurchase', $('#proofOfPurchase')[0].files[0]);
    formData.append('systemInfo', $('#systemInfo')[0].files[0]);
    formData.append('stickerLabel', $('#stickerLabel')[0].files[0]);
    formData.append('idToken', $('#idToken').val());

    $.ajax({
        type: 'POST',
        url: 'https://hicn8y3j54.execute-api.us-east-1.amazonaws.com/prod/api/v1/tickets',
        data: formData,
        processData: false,
        contentType: false,
    })
        .done((data) => {
            console.log({ data });
            hideLoadingScreen();
            showSuccessPopup('Success. A confirmation email has been sent  and you will receive a temporary password via email.');
        })
        .fail((err) => {
            console.error(err);
            hideLoadingScreen();
        })
        .always(() => {
            console.log('always called');
        });
});

function showLoadingScreen() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('loadingAnimation').style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
}

function hideLoadingScreen() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('loadingAnimation').style.display = 'none';
}

function showSuccessPopup(message) {
    document.getElementById('overlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.getElementById('popupMessage').innerText = message;
    document.getElementById('customPopup').style.display = 'block';
}

function closeCustomPopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('customPopup').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    clearForm();
    return false;
}