// ==UserScript==
// @name         Remove Clothes Duplicates
// @version      0.1
// @description  Remove the duplicate shirts and pants in the roblox catalog
// @author       Danielle
// @match        https://api.roblox.com/*
// @match        https://www.roblox.com/home
// @require      https://code.jquery.com/jquery-3.5.1.js
// @require      https://bundle.run/pixelmatch
// ==/UserScript==

/* global pixelmatch */

const perfectThreshold = .4;

let nextPageCursor = "";
let category = "&Category=3&Subcategory=12"
let keywordSearch = "20015";
let clothes = [];
let uniqueClothes = [];

let baseApiUrl = "https://catalog.roblox.com/v1/search/items/details?Keyword=" + keywordSearch + category + "&cursor=";
let usedApiUrl = baseApiUrl + nextPageCursor;

function getLink(text) {
    let linkIDstartIndex = text.indexOf("tr.rbxcdn.com/") + 14;
    let linkIDendIndex = text.indexOf("/", linkIDstartIndex + 1);
    let linkID = text.slice(linkIDstartIndex, linkIDendIndex);
    let clothingType = "Shirt";
    let link = "https://tr.rbxcdn.com/" + linkID + "/420/420/" + clothingType + "/Png";
    return link;
}

function createImg(link) {
    let img = new Image();
    img.src = link;
    img.crossOrigin = "Anonymous";
    return img;
}

function getImgData(img) {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return data;
}

function bothEqual(a, b) {
  return (pixelmatch(a.imageData, b.imageData, null, 420, 420, {threshold: perfectThreshold}) == 0);
}

async function getUniqueClothes() {
		fetch(usedApiUrl)
			.then((apiResponse) => apiResponse.json())
			.then((apiJSON) => {
				let apiData = apiJSON.data;

				let catalogIDs = apiData.map(clothing => clothing.id);

				// individual catalog item, gets thumbnail links
				let catalogIDlength = catalogIDs.length;
				for (let i = 0; i < catalogIDlength; ++i) {
					let catalogID = catalogIDs[i];

					let url = "https://www.roblox.com/catalog/" + catalogID;
					fetch(url)
						.then((response) => response.text())
						.then((text) => {
							let link = getLink(text);

							if (!link.includes("html")) {
								let img = createImg(link);
								img.onload = function() {
									let data = getImgData(img);

									let eachClothing = {
										"thumbnailLink": link,
										"imageData": data
									}

                                    let duplicate = uniqueClothes.some((uniqueClothing) => bothEqual(eachClothing, uniqueClothing));
                                    if (duplicate == false) {
                                        uniqueClothes.push(eachClothing);
                                    }
								}
							}
						});
				}
				nextPageCursor = apiJSON.nextPageCursor;
				usedApiUrl = baseApiUrl + nextPageCursor;

				console.log("finished a page");

				if (nextPageCursor != null) {
					getUniqueClothes();
				} else {
					console.log("unique clothes: ");
                    console.log(uniqueClothes);
				}
			});
}
getUniqueClothes();


