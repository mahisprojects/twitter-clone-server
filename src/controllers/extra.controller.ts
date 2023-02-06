// get year progress bar of Nepali Date

import { BadRequestError } from "common/errors/bad-request-error";
import { UnauthorizedError } from "common/errors/unauthorized-error";
import { Request, Response } from "express";
import { tweetModel } from "models/tweet.model";
import { getNPYearProgress } from "utils/dateRemaining";

export async function getNPYearProgressHandler(
  req: Request,
  res: Response,
  next
) {
  try {
    const value: number = parseFloat(getNPYearProgress());
    const pattern = "▁▂▃▄▅▆▇█";
    const bar = make_bar(value, pattern, 1, 20);
    res.send({ value, bar });
  } catch (error) {
    next(new BadRequestError("Something went wrong"));
  }
}

export async function createNPYearProgressTweet(
  req: Request,
  res: Response,
  next
) {
  try {
    if (
      !req.headers["xverificationkey"] ||
      req.headers["xverificationkey"] !== process.env.PROGRESS_VERIFY_KEY
    ) {
      next(new UnauthorizedError("Not allowed!"));
    }

    // year progress - ID@official = 63e0ba22fa146f94e37ebf94
    const yearProgressID = "63e0ba22fa146f94e37ebf94";

    const value: number = parseFloat(getNPYearProgress());
    const pattern = "▁▂▃▄▅▆▇█";
    const bar = make_bar(value, pattern, 1, 20);

    await tweetModel.create({
      content: `🇳🇵 ${bar} ${value}%`,
      owner: yearProgressID,
    });
    res.end();
  } catch (error) {
    next(new BadRequestError("Something went wrong"));
  }
}

/**
 * Source
 * https://github.com/Changaco/unicode-progress-bars
 */

function repeat(s, i) {
  var r = "";
  for (var j = 0; j < i; j++) r += s;
  return r;
}
function make_bar(p, bar_style, min_size, max_size) {
  var d,
    full,
    m,
    middle,
    r,
    rest,
    x,
    min_delta = Number.POSITIVE_INFINITY,
    full_symbol = bar_style[bar_style.length - 1],
    n = bar_style.length - 1;
  if (p == 100) return { str: repeat(full_symbol, 10), delta: 0 };
  p = p / 100;
  for (var i = max_size; i >= min_size; i--) {
    x = p * i;
    full = Math.floor(x);
    rest = x - full;
    middle = Math.floor(rest * n);
    if (p != 0 && full == 0 && middle == 0) middle = 1;
    d = Math.abs(p - (full + middle / n) / i) * 100;
    if (d < min_delta) {
      min_delta = d;
      m = bar_style[middle];
      if (full == i) m = "";
      r = repeat(full_symbol, full) + m + repeat(bar_style[0], i - full - 1);
    }
  }
  //   return { str: r, delta: min_delta };
  return r;
}
