import express from "express";

export const receiveInboundEmail = async (
  req: express.Request,
  res: express.Response
) => {
  console.log(req.body);

  res.status(200).send({});
};
