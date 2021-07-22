import express from "express";
import redis from "redis";

const { REDIS_URL } = process.env;

const client = redis.createClient({
  url: REDIS_URL,
});

client.on("error", (error) => {
  console.error(error);
});

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

const generateKey = ({ phoneNumber, userId }: Partial<SmsVerifier>): string => {
  const key = JSON.stringify({ phoneNumber, userId });
  return `sms-verify|${key}`;
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

  const key = generateKey({ phoneNumber, userId });

  client.set(key, JSON.stringify(smsVerifierObj), (err, result) => {
    if (err) {
      res.status(400).send(err);
      return;
    }

    res.status(200).send(smsVerifierObj);
  });
};

export const confirmPhoneNumber = async (
  req: express.Request,
  res: express.Response
) => {
  const { pin, userId, phoneNumber } = req.body;

  const key = generateKey({ phoneNumber, userId });

  client.get(key, (err, result) => {
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
      json = JSON.parse(result);
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
