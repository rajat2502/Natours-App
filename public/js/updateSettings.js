import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://localhost:3000/api/v1/users/updateMyPassword'
        : 'http://localhost:3000/api/v1/users/updateMe';
    const res = await axios.patch(url, data);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updates successfully!`);
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', err.response.data.messsage);
  }
};
