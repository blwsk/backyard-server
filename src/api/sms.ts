import express from "express";
import { client } from "../lib/redis";

interface SmsVerifier {
  phoneNumber: string | null;
  pin: string | null;
  userId: string | null;
  expiresAt: number | null;
}

const setSmsVerifier = ({
  phoneNumber = null,
  pin = null,
  userId = null,
  expiresAt = null,
}: Partial<SmsVerifier>): SmsVerifier => {
  return { phoneNumber, pin, userId, expiresAt };
};

/**
 * @description random left-padded 4 character pin
 */
const generateRandomPin = () => {
  const pinInt = Math.floor(Math.random() * 10000);
  const pinStr = `${pinInt}`;

  const len = pinStr.length;
  const mustPad = 4 - len;

  let leftPadded = "";

  for (let i = 0; i < mustPad; i++) {
    leftPadded += "0";
  }

  return `${leftPadded}${pinStr}`;
};

const SMS_VERIFY_KEY = "sms-verify";

const generateFieldName = ({
  phoneNumber,
  userId,
}: Partial<SmsVerifier>): string => {
  return JSON.stringify({ phoneNumber, userId });
};

const TIME_LIMIT = 5 * 60 * 1000;

export const verifyPhoneNumber = async (
  req: express.Request,
  res: express.Response
) => {
  const { phoneNumber, userId } = req.body;

  const smsVerifierObj = setSmsVerifier({
    phoneNumber,
    userId,
    pin: generateRandomPin(),
    expiresAt: Date.now() + TIME_LIMIT, // 5 minutes from now
  });

  console.log(smsVerifierObj);

  const field = generateFieldName({ phoneNumber, userId });

  client.hmset(
    SMS_VERIFY_KEY,
    field,
    JSON.stringify(smsVerifierObj),
    (err, result) => {
      if (err) {
        res.status(400).send(err);
        return;
      }

      res.status(200).send(smsVerifierObj);
    }
  );
};

export const confirmPhoneNumber = async (
  req: express.Request,
  res: express.Response
) => {
  const { pin, userId, phoneNumber } = req.body;

  const field = generateFieldName({ phoneNumber, userId });

  client.hmget(SMS_VERIFY_KEY, field, (err, result) => {
    if (err) {
      res.status(400).send(err);
      return;
    }

    if (!result) {
      res.status(404).send();
      return;
    }

    let json;

    try {
      const first = result && result[0];
      json = JSON.parse(first);
    } catch (parseError) {
      res.status(400).send();
      return;
    }

    const verifier = setSmsVerifier(json as SmsVerifier);

    if (verifier.expiresAt && verifier.expiresAt < Date.now() - TIME_LIMIT) {
      res.status(400).send({
        message: "Expired",
        match: false,
      });
      return;
    }

    const match: boolean =
      typeof verifier.pin === "string" && verifier.pin === pin;

    res.status(200).send({
      message: match ? "Success" : "Pins do not match",
      match,
    });
  });
};
