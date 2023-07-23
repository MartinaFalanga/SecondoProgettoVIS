var nodeRadius = 20;
var width = "100%";
var height = 700;
var chapterNumber = parseInt(document.querySelector('#rangeField').value);
var prevChapter = 0;
var xCenter = 700,
    yCenter = 300;
var eventTransform;
var isWritten=0;
var areLinksWritten=0;
var circles;
var nodeText;
var nodeTitle;
var node;
var link;
var simulation;

var svg = d3.select("#graph")
    .attr("width", width)
    .attr("height", height);

var nodesGroup = svg.append("g");
var nodee = nodesGroup
    .join("g")
    .attr("class", "nodes")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", eventTransform);

var linksGroup = svg.append("g");

function start() {
    d3.json('./data/characters_nodes.json').then(function (nodesData) {
        d3.json('./data/characters_actions.json').then(function (edgesData) {
            d3.json('./data/list_actions.json').then(function (actionsData) {
                d3.json('./data/gender_codes.json').then(function (gendersData) {
					
					function isFamily(actions) {
						var family_actions = actions.filter(action => action["isFamily"] === 1).map(action => action["action"]);
						var families = [];

						for (let general_actions of edgesData) {
							if (family_actions.includes(general_actions["action"])) {
								let existingFamilyIndex = families.findIndex(family => 
									family.includes(general_actions["source"]) || family.includes(general_actions["target"])
								);

								if (existingFamilyIndex !== -1) {
									if (!families[existingFamilyIndex].includes(general_actions["source"])) {
										families[existingFamilyIndex].push(general_actions["source"]);
									}
									if (!families[existingFamilyIndex].includes(general_actions["target"])) {
										families[existingFamilyIndex].push(general_actions["target"]);
									}
								} else {
									families.push([general_actions["source"], general_actions["target"]]);
								}
							}
						}
						return families;
					}
					
					function discover_family(families, id_character) {
						let foundFamilyIndex = families.findIndex((family) => {
							return family.indexOf(id_character) != -1;
						});

						return foundFamilyIndex !== -1 ? foundFamilyIndex : families.length + parseInt(id_character);
					}
					
					function createclique(families) {
						let edges = [];
						families.forEach((family, i) => {
							family.forEach((source, j) => {
								family.filter((_, h) => j < h).forEach(target => {
									edges.push({
										"source": source,
										"target": target,
										"distance": 5
									});
								});
							});
						});
						return edges;
					}

                    function setDistance(source, target, families) {
                        var source_family = discover_family(families, source);
                        var target_family = discover_family(families, target);
                        if (source_family == target_family) {
                            return 1;
                        }
                        else return 10;
                    }

                    function findChapter(chapter){
                      if(chapter=="")
                        return "1";
                      else
                        return chapter;

                    }
					
					function reset() {
                        resetUsageGuide();
                        svg.selectAll(".info").remove();
                        svg.selectAll("#svgNodeInfo").remove();
                        d3.select(this).remove();
                    }

                    function resetUsageGuide() {
						d3.select().remove();
                    }

                    function createGraphTopologyArray(nodesData, edgesData, actions, genderCodes) {
                        var result = [];

                        var characterNodes = [];
                        var characterEdges = [];
                        var familyEdges = [];
						var families = isFamily(actions);

                        nodesData.forEach(function (character) {
                            genderCodes.forEach(function (gender) {
                                if (character["gender"] == gender["gender"]) {
                                    var resolvedCharacter = {
                                        "id": character["id"],
                                        "label": character["label"],
                                        "gender": gender["gender description"],
                                        "chapter": findChapter(character["chapter"]),
                                        "page": character["page"]
                                    };
                                    characterNodes.push(resolvedCharacter);
                                }
                            })
                        });
                        edgesData.forEach(function (edge) {
                            actions.forEach(function (action) {
                                if (edge["action"] == action["action"]) {
                                    var resolvedEdge = {
                                        "source": edge["source"],
                                        "target": edge["target"],
                                        "action": action["action description"],
                                        "chapter": edge["chapter"],
                                        "distance": setDistance(edge["source"], edge["target"], families),
                                       // "page": edge["page"],
                                        "isFamily": action["isFamily"]
                                    };
                                    characterEdges.push(resolvedEdge);
                                }
                            })
                        })

                        var familyEdges = createclique(families);

                        result[0] = characterNodes;
                        result[1] = characterEdges;
                        result[2] = familyEdges;
                        return result;
                    }
					
                    function selectLinksInChapter(linksInChapter, nodesInChapter) {
                        var temp = [];
                        var nodesIds = [];

                        for (var i in nodesInChapter) {
                            var nodesIC = parseInt(nodesInChapter[i].id)
                            nodesIds.push(nodesIC)
                        }

                        for (var i in linksInChapter) {

                            var source = linksInChapter[i][0];
                            var target = linksInChapter[i][1];
                            var chapter = linksInChapter[i][2];
                            var action = linksInChapter[i][3];
                            var isFamily = linksInChapter[i][4];
                            var occurrency = linksInChapter[i][5];

                                temp.push({ source: source, target: target, chapter: chapter, action: action, isFamily: isFamily, occurrency: occurrency });
                        }
                        return temp;
                    }

                    function selectFamilyLinksInChapter(familyLinksInChapter, nodesInChapter) {
                        var temp = [];
                        var nodesIds = [];

                        for (var i in nodesInChapter) {
                            var nodesIC = parseInt(nodesInChapter[i].id)
                            nodesIds.push(nodesIC)
                        }

                        for (var i in familyLinksInChapter) {

                            var source = familyLinksInChapter[i][0]
                            var target = familyLinksInChapter[i][1]

                            if ((nodesIds.indexOf(parseInt(source)) != -1) && (nodesIds.indexOf(parseInt(target)) != -1)) {
                                temp.push({ source: source, target: target });
                            }
                        }
                        return temp;
                    }

                    function openNodeInfos(d) {
                        var svgNodeInfo = d3.select("#graph")
                            .append("svg")
                            .attr("id", "svgNodeInfo")
                            .attr("width", 1000)
                            .attr("height", 250)
                            .attr("y", 350);
                        svgNodeInfo.append("rect")
                            .attr("class", "info")
                            .attr("id", "nodeInfo")
                            .attr("x", "7%")
                            .attr("width", 350)
                            .attr("height", 200)
							.attr("rx", 15)
                            .attr("ry", 15)
                            .style("fill", "#d6e1e8")
							.style("stroke", "#47abe1")
							.style("stroke-dasharray", "3");
                        svgNodeInfo.append("text")
                            .attr("class", "info")
                            .text("ID: ")
                            .style("font-weight", 700)
                            .attr("x", "8%")
                            .attr("y", "25%")
                            .style("font-size", "15px")
                            .append("tspan")
                            .text(d.srcElement.__data__.id)
                            .style("font-weight", 300);
                        svgNodeInfo.append("text")
                            .attr("class", "info")
                            .text("Nome: ")
                            .attr("x", "8%")
                            .attr("y", "15%")
                            .style("font-size", "15px")
                            .style("font-weight", 700)
                            .append("tspan")
                            .text(d.srcElement.__data__.label)
                            .style("font-weight", 300);
                        svgNodeInfo.append("text")
                            .attr("class", "info")
                            .text("Genere: ")
                            .attr("x", "8%")
                            .attr("y", "35%")
                            .style("font-size", "15px")
                            .style("font-weight", 700)
                            .append("tspan")
                            .text(d.srcElement.__data__.gender)
                            .style("font-weight", 300);
                        svgNodeInfo.append("text")
                            .attr("class", "info")
                            .text(() => {
                                if (d.srcElement.__data__.chapter != "")
                                    return "Prima apparizione: ";
                            })
                            .attr("x", "8%")
                            .attr("y", "45%")
                            .style("font-size", "15px")
                            .style("font-weight", 700)
                            .append("tspan")
                            .text(function () {
                                if (d.srcElement.__data__.chapter != "")
                                    return "capitolo " + d.srcElement.__data__.chapter;
                            })
                            .style("font-weight", 300);
						svgNodeInfo.append("text")
                            .attr("class", "info")
                            .text(() => {
                                if (d.srcElement.__data__.page != "")
                                    return "Pagina: ";
                            })
                            .attr("x", "8%")
                            .attr("y", "55%")
                            .style("font-size", "15px")
                            .style("font-weight", 700)
                            .append("tspan")
                            .text(function () {
                                if (d.srcElement.__data__.page != "")
                                    return "pagina " + d.srcElement.__data__.page;
                            })
                            .style("font-weight", 300);
						svgNodeInfo.append("rect")
                            .attr("class", "button")
                            .attr("id", "resetButton")
                            .attr("x", "30%")
                            .attr("y", "60%")
                            .attr("width", 40)
                            .attr("height", 30)
							.attr("rx", 15)
                            .attr("ry", 15)
                            .style("fill", "white")
							.style("stroke", "#47abe1")
							.style("stroke-dasharray", "3")
                            .on("click", reset);
                        svgNodeInfo.append("text")
                            .attr("class", "info")
                            .text("Chiudi")
                            .attr("x", "33%")
                            .attr("y", "70%")
                            .style("font-size", "13px")
							.style("font-weight", "bold");
                    }

                    function defineLinksColor(link) {
                        if (link.chapter < chapterNumber) {
                            return "#999";
                        }
						else
                            return "green";
                    }

                    var mLinkNum = {};

                    function positionLink(d, mLinkNum) {
                        var dx = d.target.x - d.source.x;
                        var dy = d.target.y - d.source.y;
                        var dr = Math.sqrt(dx * dx + dy * dy);
                        var lTotalLinkNum = mLinkNum[d.source.id + "," + d.target.id] || mLinkNum[d.target.id + "," + d.source.id];
                        if (lTotalLinkNum > 1) {
                            dr = (dr / (1 + (1 / lTotalLinkNum) * (d.occurrency - 1)));
                        }

                        var dToReturn = "M " + d.source.x + "," + d.source.y +
                            " A " + dr + " " + dr + " 0 0 1," + d.target.x + " " + d.target.y;

                        if (d.target.x == d.source.x && d.target.y == d.source.y) {
                            dToReturn = "M " + d.source.x + "," + d.source.y + " A 100 100 0 0 1," + d.target.x + " " + d.target.y;
                        }
                        return dToReturn;
                    }
					
					function selectNodesForChapter(nodesInChapter) {
						return nodesInChapter.map(node => {
							return {
								id: node[0],
								chapter: node[1],
								label: node[2],
								gender: node[3],
								page: node[4],
							};
						});
					}
					
                    function getActionText(source, target, action) {
						switch(action) {
							case "sibling":
								return `${source.label} e ${target.label} sono fratelli.`;
							case "descent":
								return `${source.label} discende da ${target.label}.`;
							case "marriage":
								return `${source.label} e ${target.label} si sposano.`;
							case "fostering":
								return `${source.label} supporta ${target.label}.`;
							case "betrothal":
								return `${source.label} dichiara il suo amore a ${target.label}.`;
							case "inheritance":
								return `${source.label} eredita ${target.label}.`;
							case "succession":
								return `${source.label} succede a ${target.label}.`;
							case "placed in command":
								return `${source.label} mette al comando ${target.label}.`;
							case "request assistance":
								return `${source.label} richiede assistenza a ${target.label}.`;
							case "offer assistance":
								return `${source.label} offre assistenza a ${target.label}.`;
							case "provide information":
								return `${source.label} fornisce informazioni a ${target.label}.`;
							case "discover information":
								return `${source.label} scopre informazioni e si riferisce a ${target.label}.`;
							case "invitation":
								return `${source.label} invita ${target.label}.`;
							case "giftgiving":
								return `${source.label} dà un regalo a ${target.label}.`;
							case "accusation":
								return `${source.label} incolpa ${target.label}.`;
							case "summons":
								return `${source.label} convoca ${target.label}.`;
							case "lying":
								return `${source.label} mente a ${target.label}.`;
							case "insult":
								return `${source.label} insulta ${target.label}.`;
							case "threat":
								return `${source.label} minaccia ${target.label}.`;
							case "intervention":
								return `${source.label} interviene nelle cose di ${target.label}.`;
							case "challenge":
								return `${source.label} sfida ${target.label}.`;
							case "hostility_non-lethal":
								return `${source.label} è in ostilità non letale con ${target.label}.`;
							case "hostility_lethal":
								return `${source.label} è in ostilità letale con ${target.label}.`;
							case "conversation_neutral":
								return `${source.label} conversa con ${target.label}.`;
							case "death_neutral":
								return `${source.label} uccide in modo neutrale ${target.label}.`;
							case "request information":
								return `${source.label} richiede informazioni a ${target.label}.`;
							case "name giving":
								return `${source.label} dà un nome a ${target.label}.`;
							case "suicide":
								return `${source.label} commette un suicidio (${target.label} muore).`;
							case "ownership":
								return `${source.label} possiede ${target.label}.`;
							default:
								return "";
						}
					}
					
					function visualizeLinkDetails(link) {
						var data = link.srcElement.__data__;
						if (data.chapter == chapterNumber) {
							var azione = data.action;
							var source = data.source;
							var target = data.target;
							var edgeInfo = d3.select("#graph");

							var text = edgeInfo.append("text")
								.attr("class", "edgeAction")
								.attr("id", "edgeActionText")
								.text(() => getActionText(source, target, azione))
								.attr("x", "41%")
								.attr("y", "10%")
								.style("font-size", "13px");

							var bbox = text.node().getBBox();

							edgeInfo.insert("rect", "#edgeActionText")
								.attr("class", "edgeAction")
								.attr("id", "nodeInfo")
								.attr("x", "40%")
								.attr("y", "7%")
								.attr("rx", 15)
								.attr("ry", 15)
								.attr("width", bbox.width + 40)
								.attr("height", 50)
								.style("fill", "#d6e1e8")
								.style("stroke", "#47abe1")
								.style("stroke-dasharray", "3");
						}
					}
					
					function sortLinks(linksToSort) {
						return linksToSort.sort((a, b) => {
							let sourceCompare = parseInt(a.source) - parseInt(b.source);
							if (sourceCompare !== 0) {
								return sourceCompare;
							} else {
								return parseInt(a.target) - parseInt(b.target);
							}
						});
					}
					
					function linkOccurAndNIterative(l) {
						let key = l.source + "," + l.target;
						l.occurrency = !isNaN(mLinkNum[key]) ? mLinkNum[key] + 1 : 1;
						mLinkNum[key] = l.occurrency;
						return l;
					}

                    function defineLinkClass(d){
                        if(prevChapter < chapterNumber){
                            if(parseInt(d.chapter) == chapterNumber){
                                return "color";
                            }
                            else{
                                if(parseInt(d.chapter) <= chapterNumber){
                                  return "grey";
                                }
                                return "none";
                            }
                        }
                        else {
                            if(parseInt(d.chapter) > chapterNumber){
                              return "none";
                            }
                            else if (parseInt(d.chapter) == chapterNumber){
                                return "color";
                            }
                            else return "grey";
                        }
                    }

                    async function defineLinksMovement(){
                        d3.selectAll(".color").attr("d", d => positionLink(d, mLinkNum));
                        d3.selectAll(".grey").attr("d", d => positionLink(d, mLinkNum));
                    }

                    function ForceGraph({ nodes, links, family }, {
                        nodeId = d => d.id,
                        nodeLabel = d => d.label,
                        nodeGender = d => d.gender,
						nodePage = d => d.page,
                        nodeGroup,
                        nodeGroups,
                        nodeTitle = d => d.label,
                        nodeStrokeOpacity = 1,
                        nodeRadius = 10,
                        nodeStrength,
                        nodeChapter = ({ chapter }) => chapter,
                        linkSource = ({ source }) => source,
                        linkTarget = ({ target }) => target,
                        linkoccurrency = ({ occurrency }) => occurrency,
                        linkDistance = ({ distance }) => distance,
                        linkStrokeOpacity = (link) => parseInt(link["chapter"]) == chapterNumber ? 1 : 0.2,
                        linkStrokeLinecap = "round",
                        linkStrength,
                        linkChapter = ({ chapter }) => chapter,
                        linkIsFamily = ({ isFamily }) => isFamily,
                        linkAction = ({ action }) => action,
                        colors = d3.schemeTableau10,
                        invalidation,
                        familySource = ({ source }) => source,
                        familyTarget = ({ target }) => target,
                        familyDistance = ({ distance }) => distance
                    } = {}) {

                        const N = d3.map(nodes, nodeId).map(intern);
                        const NLabel = d3.map(nodes, nodeLabel).map(intern);
                        const NGender = d3.map(nodes, nodeGender).map(intern);
						const NPage = d3.map(nodes, nodePage).map(intern);
                        const NC = d3.map(nodes, nodeChapter).map(intern);
						const LF = d3.map(links, linkIsFamily).map(intern);
                        const LA = d3.map(links, linkAction).map(intern);
                        const LI = d3.map(links, linkoccurrency).map(intern);
						const LS = d3.map(links, linkSource).map(intern);
                        const LT = d3.map(links, linkTarget).map(intern);
                        const LC = d3.map(links, linkChapter).map(intern);
                        if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
                        const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
                        const FD = d3.map(family, familyDistance).map(intern);
                        const FS = d3.map(family, familySource).map(intern);
                        const FT = d3.map(family, familyTarget).map(intern);
						var allNodes = d3.map(nodes, (_, i) => ([N[i], NC[i], NLabel[i], NGender[i], NPage[i]]));
                        var linksInChapter = d3.map(links, (_, i) => ([LS[i], LT[i], LC[i], LA[i], LF[i], LI[i]]));
                        var familyLinks = d3.map(family, (_, i) => ([FS[i], FT[i]]));
						var nodesInChapter = selectNodesForChapter(allNodes);
                        var linksInChapter = selectLinksInChapter(linksInChapter, nodesInChapter);
                        var familyLinkInChapter = selectFamilyLinksInChapter(familyLinks, nodesInChapter);
						if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);
                        const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);
						const forceNode = d3.forceManyBody();
                        const forceLink = d3.forceLink(linksInChapter).id((l => nodesInChapter[l.index].id));
                        const forceFamilyLink = d3.forceLink(familyLinkInChapter).id(({ index: i }) => nodesInChapter[i].id).distance(5).strength(0.03);
                        if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
                        if (linkStrength !== undefined) {
                            forceLink.strength(linkStrength);
                            forceFamilyLink.strength(linkStrength);
                        }

                        simulation = d3.forceSimulation(nodesInChapter)
                            .force("link", forceLink)
                            .force("link", forceFamilyLink)
                            .force("charge", forceNode)
                            .force("center", d3.forceCenter(xCenter, yCenter))
                            .on("tick", ticked);


                        if(areLinksWritten==0){
                            link = linksGroup
                                .lower()
                                .attr("class", "links")
                                .attr("stroke-linecap", linkStrokeLinecap)
                                .attr("transform", eventTransform)
                                .selectAll("path")
                                .data(linksInChapter)
                                .join("path")
                                .attr("id", d => d.id);
                            areLinksWritten = 1;
                        }

                        link
                          .attr("class", d => defineLinkClass(d))
                          .attr("stroke-width", function (d) {
                              if (parseInt(d.chapter) == chapterNumber)
                                  return 3;
                              else return 1;
                          })
                          .attr("stroke-opacity", function (d) {
                              if (parseInt(d.chapter) == chapterNumber){
                                  return 1;
                              }
                              else {
                                  return 0.2;
                              }
                          })
                          .on("mouseover", d => visualizeLinkDetails(d))
                          .on("mouseleave", () => svg.selectAll(".edgeAction").remove());


                        d3.selectAll(".color").attr("stroke", l => defineLinksColor(l));
                        d3.selectAll(".grey").attr("stroke", "#999");
                        d3.selectAll(".none").attr("stroke", "transparent");
                        var linkedByIndex = {};
                        links.forEach(function (d) {
                            if (d.isFamily == 0 && d.chapter <= chapterNumber) {
                                linkedByIndex[d.source + "," + d.target] = 1;
                            }
                        });

                        function isConnected(a, b) {
                            return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id] || a.id == b.id;
                        }
						
						function mouseOver(opacity) {
							return function (d) {
								var thisOpacity = 1;
								var d = d.srcElement.__data__;

								function applyOpacity(o) {
									thisOpacity = isConnected(d, o) ? 1 : opacity;
									return thisOpacity;
								}

								function applyLinkOpacity(o) {
									if (d.chapter <= chapterNumber && o.chapter <= chapterNumber) {
										return o.source.id == d.id || o.target.id == d.id ? 1 : opacity;
									}
									return 0;
								}

								function applyLinkColor(o) {
									if (d.chapter <= chapterNumber && o.chapter <= chapterNumber) {
										return o.source.id == d.id || o.target.id == d.id ? defineLinksColor(o) : "transparent";
									}
									return "transparent";
								}

								d3.selectAll("circle").style("stroke-opacity", applyOpacity);
								d3.selectAll("circle").style("fill-opacity", applyOpacity);
								link.attr("stroke-opacity", applyLinkOpacity);
								link.attr("stroke", applyLinkColor);
							};
						}
						
						function applyCircleStrokeOpacity() {
							d3.selectAll("circle").style("stroke-opacity", nodeStrokeOpacity);
						}

						function applyCircleFillOpacity() {
							d3.selectAll("circle").style("fill-opacity", 1);
						}

						function applyLinkStrokeOpacity() {
							link.attr("stroke-opacity", linkStrokeOpacity);
						}

						function applyLinkStroke() {
							link.attr("stroke", l => defineLinksColor(l));
						}

						function applyColorStroke() {
							d3.selectAll(".color").attr("stroke", l => defineLinksColor(l));
						}

						function applyGreyStroke() {
							d3.selectAll(".grey").attr("stroke", "#999");
						}

						function applyNoneStroke() {
							d3.selectAll(".none").attr("stroke", "transparent");
						}

						function mouseOut() {
							applyCircleStrokeOpacity();
							applyCircleFillOpacity();
							applyLinkStrokeOpacity();
							applyLinkStroke();
							applyColorStroke();
							applyGreyStroke();
							applyNoneStroke();
						}

                      if(isWritten==0){
                        node = nodee
                            .selectAll(".node")
                            .data(nodesInChapter)
                            .join("g")
                            .attr("id", function(d){
                                return "node"+d.id;
                            })

                        circles = node.append("circle");
                        nodeTitle = node.append("title").text(d => d.label);
                        nodeText = node.append("text");
                        isWritten=1;
                      }

                      node
                        .attr("class", function (d) {
                            if(prevChapter < chapterNumber){
                                if((parseInt(d.chapter) > prevChapter) && (parseInt(d.chapter) <= chapterNumber)){
                                    return "node";
                                }
                                else{
                                    if(parseInt(d.chapter) <= chapterNumber){
                                      return "in";
                                    }
                                    return "out";
                                }
                            }
                            else {
                                if(parseInt(d.chapter) > chapterNumber){
                                  return "out";
                                }
                            }
                        });

                        circles
                            .attr("id", d => "circle" + d.id)
                            .on("click", d => {
                                reset();
                                openNodeInfos(d);
                            })
                            .on("mouseover", mouseOver(0.2))
                            .on("mouseout", mouseOut);

                        d3.selectAll(".node").select("circle")
                            .attr("r", nodeRadius);

                        d3.selectAll(".out").select("circle")
                            .attr("r", 0);

                        nodeText
                            .attr("dx", 12)
                            .attr("dy", ".35em")
                            .style("stroke", "black")
                            .style("stroke-width", 0.5)
                            .style("fill", "gray")
                            .text(function (d) {
                              if(svg.select("#node"+d.id).attr("class") == "out")
                                  return "";
                              return d.label;
                            });

                        if (invalidation != null) invalidation.then(() => simulation.stop());

                        svg.call(d3.zoom()
                            .scaleExtent([1 / 2, 8])
                            .on("zoom", zoomGraph));

                        function intern(value) {
                            return value !== null && typeof value === "object" ? value.valueOf() : value;
                        }

                        function ticked() {
                            defineLinksMovement();

                            circles.attr("cx", d => d.x)
                                .attr("cy", d => d.y);
                            nodeText.attr("x", d => d.x)
                                .attr("y", d => d.y);
                        }

                        function zoomGraph(event) {
                            eventTransform = event.transform;
                            svg.selectAll(".nodes").attr("transform", eventTransform);
                            svg.selectAll(".links").attr("transform", eventTransform);
                        }

                        return Object.assign(svg.node(), { scales: { color } });
                    }

					var result = createGraphTopologyArray(nodesData, edgesData, actionsData, gendersData);
                    var nodes = result[0];
                    var links = result[1];
                    var family = result[2];
                    links = sortLinks(links);
                    links = links.map(l => linkOccurAndNIterative(l));

                    ForceGraph({ nodes, links, family }, {
                        nodeId: d => d.id,
                        nodeGroup: d => d.group,
                        nodeTitle: d => `${d.label}`,
                        width,
                        height,
                    });
					
					function updateGraph() {
						reset();
						let rangeField = document.querySelector('#rangeField');
						prevChapter = chapterNumber;
						chapterNumber = parseInt(rangeField.value);
						let sortedLinks = sortLinks(links);
						links = sortedLinks.map(link => linkOccurAndNIterative(link));
						let graphOptions = {
							nodes,
							links,
							family,
							nodeId: node => node.id,
							nodeGroup: node => node.group,
							nodeTitle: node => `${node.label}`,
							width,
							height: 600,
						};
						ForceGraph(graphOptions);
					}
					
                    document.body.addEventListener("change", updateGraph);

                });
            });
        });
    });
}
start();
