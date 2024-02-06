import * as fdesk from "./client/freshdesk.js";
import { parse } from "aws-multipart-parser";
import { default as FormData } from "form-data";
import * as Validator from "./aws-cognito/validator.js";

function populateResp(statusCode) {
    let resp = {
        statusCode: statusCode,
        headers: {
            "Cache-control": "no-store",
            Pragma: "no-cache",
            "Strict-Transport-Security":
                "max-age=63072000; includeSubdomains; preload",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
            "Access-Control-Allow-Origin": "https://www.lorex.com", // *
            "Access-Control-Allow-Headers":
                "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
        },
    };
    return resp;
}

export const create = async (event) => {
    if (1 == process.env.LOG_EVENT_BODY) {
        console.debug(`Create event body: ${event.body}`);
    }
    const resp = populateResp(500);
    const fd = parse(event, true);

    if (!fd.idToken) {
        resp.statusCode = 403;
        resp.body = JSON.stringify(`Unauthorized`);
        return resp;
    }
    try {
        var result = await Validator.verifyToken(fd.idToken);
        if (result.error) {
            resp.statusCode = 403;
            resp.body = JSON.stringify(`Invalid token`);
            return resp;
        }
        fd.emailAddress = result.data.email;
        console.log(`result: ${JSON.stringify(result)}`);
    } catch (err) {
        resp.statusCode = 400;
        resp.body = JSON.stringify(`Invalid token`);
        return resp;
    }

    if (
        !fd ||
        !fd.firstName ||
        !fd.lastName ||
        !fd.phoneNumber ||
        !fd.deviceID ||
        !fd.serialNumber ||
        !fd.dateDevice ||
        !fd.proofOfPurchase ||
        !fd.systemInfo ||
        !fd.stickerLabel
    ) {
        resp.statusCode = 400;
        resp.body = JSON.stringify(`Please make sure all fields are filled.`);
        return resp;
    }

    try {
        var form = new FormData();
        form.append("subject", "Forgot password");
        form.append(
            "description",
            `
    First Name: ${fd.firstName}<br>
    Last Name: ${fd.lastName}<br>
    Phone Number: ${fd.phoneNumber}<br>
    Model Number: ${fd.modelNumber}<br>
    Device ID: ${fd.deviceID}<br>
    Serial Number: ${fd.serialNumber}<br>
    Date of the Device: ${fd.dateDevice}<br>
    `
        );
        form.append("email", fd.emailAddress);
        form.append("phone", fd.phoneNumber);
        form.append("priority", 1);
        form.append("status", 2);
        form.append("group_id", 72000490434);
        form.append("attachments[]", Buffer.from(fd.proofOfPurchase.content), {
            filename: fd.proofOfPurchase.filename,
            // contentType: "image/png",
        });
        form.append("attachments[]", Buffer.from(fd.systemInfo.content), {
            filename: fd.systemInfo.filename,
        });
        form.append("attachments[]", Buffer.from(fd.stickerLabel.content), {
            filename: fd.stickerLabel.filename,
        });
        const createResult = await fdesk.createTicket(form);
        if (createResult.error) {
            resp.statusCode = createResult.statusCode;
            resp.body = createResult.errMsg;
            if (1 == process.env.LOG_RES_BODY_TO_LAMBDA_CALLER) {
                console.debug(
                    `Response statusCode: ${resp.statusCode}, body: ${resp.body}`
                );
            }
            return resp;
        }
        resp.statusCode = 201;
        resp.body = JSON.stringify({
            ticketID: createResult.id,
            createdAt: createResult.created_at,
        });
    } catch (e) {
        console.error(`error: ${JSON.stringify(e)}`);
        resp.statusCode = e.statusCode;
        resp.body = JSON.stringify(e.errMsg);
    }
    return resp;
};
