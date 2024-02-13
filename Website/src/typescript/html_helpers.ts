import { $ } from 'jquery'

// this is for general purpose HTML code

export function resetTableScroll() {
    // for some reason we need to set a timer. a known issue in many browsers
    window.setTimeout(function() {
        document.getElementById('table-entry-scroll').scrollTop = 0;
    }, 0);
};

export function setSimpleTablePopupList(table_data, element) {
    // had to move this to prevent a circular import - was in calculate_charts before
    // just do the list with data[0] and data[1].toString() raw
    let row_index = 1;
    for(let data of table_data) {
        // simple (!), just add this as a child of the table
        // <tr>
        //   <th scope="row">1</th>
        //   <td>Date</td>
        //   <td>Length</td>
        // </tr>
        let row = document.createElement('tr');
        let header = document.createElement('th');
        header.setAttribute('scope', 'row');
        header.innerHTML = row_index.toString();
        let column1 = document.createElement('td');
        let column2 = document.createElement('td');
        column1.innerHTML = data[0];
        column2.innerHTML = data[1].toString();
        row.appendChild(header);
        row.appendChild(column1);
        row.appendChild(column2);
        element.appendChild(row);
        row_index += 1;
    }
};

export function displayPopOut(title, data) {
    resetTableScroll();
    let table = document.getElementById('table-entry');
    // clear any children of this element
    table.replaceChildren();
    setSimpleTablePopupList(data, table);
    document.getElementById('dialog-table-title').innerHTML = title;
    // display the modal
    $('#table-dialog').modal();
};

export function hidePopOut() {
    $('#table-dialog').modal('hide');
};
