import React from 'react';
import '../App.css'

const JobsTable = () => {
    return (
        <div className="container">
            <table>
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Job ID</th>
                        <th scope="col">Website</th>
                        <th scope="col">Order</th>
                        <th scope="col">Schedule Type</th>
                        <th scope="col">Days</th>
                        <th scope="col">Times</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">1</th>
                        <td>Mark</td>
                        <td>Otto</td>
                        <td>@mdo</td>
                        <td>@mdo</td>
                        <td>@mdo</td>
                        <td>@mdo</td>
                    </tr>
                    <tr>
                        <th scope="row">2</th>
                        <td>Jacob</td>
                        <td>Thornton</td>
                        <td>@fat</td>
                        <td>@mdo</td>
                        <td>@mdo</td>
                        <td>@mdo</td>
                    </tr>
                    <tr>
                        <th scope="row">3</th>
                        <td colspan="1">Larry the Bird</td>
                        <td>@twitter</td>
                        <td>@mdo</td>
                        <td>@mdo</td>
                        <td>@mdo</td>
                        <td>@mdo</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default JobsTable;
