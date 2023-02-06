// calculate year remaining/progress in Nepali Date

const DateConverter = require("./nepaliDate");

export function getNPYearProgress() {
  var converter = new DateConverter();
  converter.setCurrentDate();
  const currentNepaliYearTD = converter.getNepaliYear().toString().substring(2);
  const totalDaysInActiveYear = converter.nepaliYearDays(currentNepaliYearTD);

  // const daysCount = converter.getNepaliDateDifference(converter.getNepaliYear() + 1, 1, 1)
  // console.log(daysCount)

  converter.setNepaliDate(converter.getNepaliYear() + 1, 1, 1);
  const newYearDate = `${converter.englishYear}/${converter.englishMonth}/${converter.englishDate}`;

  // get days in nepali year
  const yearLeftDays = getDaysBetweenDate(new Date(), new Date(newYearDate));
  const progressYear =
    (totalDaysInActiveYear - yearLeftDays) / totalDaysInActiveYear;
  return (progressYear * 100).toFixed(2);
}

// get days between two date
function getDaysBetweenDate(a: Date, b: Date): number {
  const timeA = a.getTime();
  const timeB = b.getTime();
  let diff = timeA > timeB ? timeA - timeB : timeB - timeA;
  // One day Time in ms (milliseconds)
  const day = 60 * 60 * 24 * 1000;
  return parseInt((diff / day).toFixed(0));
}
