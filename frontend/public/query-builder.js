/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = () => {
    let query = {};
    let activeTab = getActiveTab();
    if (activeTab === "rooms") {
        query = getRoomsQuery();
    } else if (activeTab === "courses") {
        query = getCoursesQuery();
    }
    return query;
};

let hasTransformations = false;

function getActiveTab() {
    return document.getElementsByClassName("nav-item tab active").item(0).getAttribute("data-type");
}

function getCoursesQuery() {
    let query = {};
    // condition
    let condition = "";
    if (document.getElementById("courses-conditiontype-all").getAttribute("checked") !== null) {
        condition = "AND";
    } else if (document.getElementById("courses-conditiontype-any").getAttribute("checked") !== null) {
        condition = "OR";
    } else if (document.getElementById("courses-conditiontype-none").getAttribute("checked") !== null) {
        condition = "NOT";
    }

    // filters
    let filters = getFilters("courses");

    // add WHERE
    query["WHERE"] = getWhereObject(condition, filters);

    // orders
    let isDescending = document.getElementById("courses-order").getAttribute("checked") !== null;
    let orders = getOrders("courses");

    // columns
    let columns = getColumns("courses");

    // groups
    let groups = getGroups("courses");

    // transformations
    let transformations = getTransformations("courses");

    // add OPTIONS
    if (orders.length > 0 || columns.length > 0) {
        query["OPTIONS"] = getOptionsObject(isDescending, orders, columns);
    }

    // add TRANSFORMATIONS
    if (groups.length > 0 || transformations.length > 0) {
        query["TRANSFORMATIONS"] = getTransformationsObject(groups, transformations);
    }

    return query;
}

function getRoomsQuery() {
    let query = {};
    // condition
    let condition = "";
    if (document.getElementById("rooms-conditiontype-all").getAttribute("checked") !== null) {
        condition = "AND";
    } else if (document.getElementById("rooms-conditiontype-any").getAttribute("checked") !== null) {
        condition = "OR";
    } else if (document.getElementById("rooms-conditiontype-none").getAttribute("checked") !== null) {
        condition = "NOT";
    }

    // filters
    let filters = getFilters("rooms");

    // add WHERE
    query["WHERE"] = getWhereObject(condition, filters);

    // orders
    let isDescending = document.getElementById("rooms-order").getAttribute("checked") !== null;
    let orders = getOrders("rooms");

    // columns
    let columns = getColumns("rooms");

    // groups
    let groups = getGroups("rooms");

    // transformations
    let transformations = getTransformations("rooms");

    // add OPTIONS
    if (orders.length > 0 || columns.length > 0) {
        query["OPTIONS"] = getOptionsObject(isDescending, orders, columns);
    }

    // add TRANSFORMATIONS
    if (groups.length > 0 || transformations.length > 0) {
        query["TRANSFORMATIONS"] = getTransformationsObject(groups, transformations);
    }

    return query;
}

function getFilters(tabType) {
    let controlGroups = document.getElementById("tab-" + tabType).getElementsByClassName("control-group condition");
    let groups = [];
    for (let controlGroup of controlGroups) {
        let individualGroup = [];
        let controlNot = controlGroup.getElementsByClassName("control not").item(0).getElementsByTagName("input").item(0).getAttribute("checked") !== null;
        individualGroup.push(controlNot);
        let controlField = controlGroup.getElementsByClassName("control fields").item(0);
        let options = controlField.getElementsByTagName("select").item(0);
        for (let option of options) {
            if (option.getAttribute("selected") !== null) {
                individualGroup.push(tabType + "_" + option.getAttribute("value"));
                break;
            }
        }
        let operators = controlGroup.getElementsByClassName("control operators").item(0);
        let operatorOptions = operators.getElementsByTagName("select").item(0);
        for (let operatorOption of operatorOptions) {
            if (operatorOption.getAttribute("selected") !== null) {
                individualGroup.push(operatorOption.getAttribute("value"));
                break;
            }
        }
        let numberKeys = ["courses_avg", "courses_pass", "courses_fail", "courses_audit", "courses_year",
            "rooms_lat", "rooms_lon", "rooms_seats"];
        let isNumberKey = numberKeys.includes(individualGroup[1]);
        let controlTerm = controlGroup.getElementsByClassName("control term").item(0).getElementsByTagName("input").item(0);
        let value = controlTerm.getAttribute("value");
        if (isNumberKey && value !== null && value.length !== 0 && !isNaN(value)) {
            individualGroup.push(Number(value));
        } else if (value === null) {
            individualGroup.push("");
        } else {
            individualGroup.push(value);
        }
        groups.push(individualGroup);
    }
    return groups;
}

function getGroups(tabType) {
    let controlGroups = document.getElementById("tab-" + tabType).getElementsByClassName("form-group groups").item(0).getElementsByClassName("control field");
    let groups = [];
    for (let controlGroup of controlGroups) {
        let group = controlGroup.getElementsByTagName("input").item(0);
        if (group.getAttribute("checked") !== null) {
            groups.push(tabType + "_" + group.getAttribute("value"));
        }
    }
    return groups;
}

function getTransformations(tabType) {
    let controlGroups = document.getElementById("tab-" + tabType).getElementsByClassName("control-group transformation");
    let transformations = [];
    for (let controlGroup of controlGroups) {
        let individualGroup = [];
        let controlTerm = controlGroup.getElementsByClassName("control term").item(0).getElementsByTagName("input").item(0);
        let value = controlTerm.getAttribute("value");
        if (value !== null) {
            individualGroup.push(value);
        } else {
            individualGroup.push("");
        }
        let operators = controlGroup.getElementsByClassName("control operators").item(0);
        let operatorOptions = operators.getElementsByTagName("select").item(0);
        for (let operatorOption of operatorOptions) {
            if (operatorOption.getAttribute("selected") !== null) {
                individualGroup.push(operatorOption.getAttribute("value"));
                break;
            }
        }
        let controlField = controlGroup.getElementsByClassName("control fields").item(0);
        let options = controlField.getElementsByTagName("select").item(0);
        for (let option of options) {
            if (option.getAttribute("selected") !== null) {
                individualGroup.push(tabType + "_" + option.getAttribute("value"));
                break;
            }
        }
        transformations.push(individualGroup);
    }
    if (transformations.length > 0) {
        hasTransformations = true;
    } else {
        hasTransformations = false;
    }
    return transformations;
}

function getColumns(tabType) {
    let columns = document.getElementById("tab-" + tabType).getElementsByClassName("form-group columns").item(0).getElementsByTagName("input");
    let selectedColumns = [];
    let allColumns = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid",
        "lat", "lon", "seats", "fullname", "shortname", "number", "name", "address", "href", "type", "furniture"];
    for (let column of columns) {
        if (column.getAttribute("checked") !== null) {
            if (allColumns.includes(column.getAttribute("value"))) {
                selectedColumns.push(tabType + "_" + column.getAttribute("value"));
            } else {
                selectedColumns.push(column.getAttribute("value"));
            }
        }
    }
    return selectedColumns;
}

function getOrders(tabType) {
    let orders = document.getElementById("tab-" + tabType).getElementsByClassName("control order fields").item(0).getElementsByTagName("select").item(0);
    let selectedOrders = [];
    let allOrders = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid",
        "lat", "lon", "seats", "fullname", "shortname", "number", "name", "address", "href", "type", "furniture"];
    for (let order of orders) {
        if (order.getAttribute("selected") !== null) {
            if (allOrders.includes(order.getAttribute("value"))) {
                selectedOrders.push(tabType + "_" + order.getAttribute("value"));
            } else {
                selectedOrders.push(order.getAttribute("value"));
            }
        }
    }
    return selectedOrders;
}

function getWhereObject(condition, filters) {
    let object = {};
    let allObjects = [];
    if (filters.length < 1) {
        return object;
    }
    for (let filter of filters) {
        let object1 = {};
        let object2 = {};
        let object3 = {};
        object1[filter[1]] = filter[3];
        object2[filter[2]] = object1;
        if (filter[0]) {
            object3["NOT"] = object2;
            allObjects.push(object3);
        } else {
            allObjects.push(object2);
        }
    }
    if (allObjects.length > 1 && condition !== "NOT") {
        object[condition] = allObjects;
        return object;
    } else if (condition === "NOT") {
        let notObject = {};
        object["OR"] = allObjects;
        notObject["NOT"] = object;
        return notObject;
    }
    return allObjects[0];
}

function getOptionsObject(isDescending, orders, columns) {
    let transformations = hasTransformations;
    let object = {};
    let object1 = {};
    object["COLUMNS"] = columns;
    if (orders.length > 1 || transformations) {
        if (isDescending) {
            object1["dir"] = "DOWN";
        } else {
            object1["dir"] = "UP";
        }
        object1["keys"] = orders;
        if (orders.length > 0) {
            object["ORDER"] = object1;
        }

    } else {
        if (orders.length > 0) {
            object["ORDER"] = orders[0];
        }
    }
    return object;
}

function getTransformationsObject(groups, transformations) {
    let object = {};
    let applyObjects = [];
    if (groups.length > 0) {
        object["GROUP"] = groups;
    }
    for (let transformation of transformations) {
        let object1 = {};
        let object2 = {};
        object1[transformation[1]] = transformation[2];
        object2[transformation[0]] = object1;
        applyObjects.push(object2);
    }
    object["APPLY"] = applyObjects;
    return object;
}
