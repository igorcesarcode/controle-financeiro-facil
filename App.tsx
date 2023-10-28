import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
import Moment from "moment";
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

// function Items({ items: doneHeading, onPressItem }) {
//   const [items, setItems] = useState(null);
//   console.log("Items()");
//   useEffect(() => {
//     console.log("doneHeading: " + doneHeading);
//     db.transaction((tx) => {
//       tx.executeSql(
//         `select * from despesas where categoria = ?;`,
//         [doneHeading],
//         (_, { rows: { _array } }) => setItems(_array)
//       );
//     });
//   }, []);

//   const heading = "Despesas de " + doneHeading;

//   if (items === null || items.length === 0) {
//     return null;
//   }

//   return (
//     <View style={styles.sectionContainer}>
//       <Text style={styles.sectionHeading}>{heading}</Text>
//       {items.map(({ id, done, value, data, valor }) => (
//         <TouchableOpacity
//           key={id}
//           onPress={() => onPressItem && onPressItem(id)}
//           style={{
//             backgroundColor: done ? "#1c9963" : "#fff",
//             borderColor: "#000",
//             borderWidth: 1,
//             padding: 8,
//           }}
//         >
//           <View style={styles.flexRow}>
//             <Text>{Moment(data).format("DD/MM/yyyy")} - </Text>
//             <Text>
//               {valor.toLocaleString("pt-BR", {
//                 style: "currency",
//                 currency: "BRL",
//               })}
//             </Text>
//             <Text>{value ? " - " + value : ""} </Text>
//           </View>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );
// }

interface DropdownItensProps {
  label: string;
  value: string;
}

interface SQLProps {
  rows: { _array: DropdownItensProps[] };
}

interface SQLItensProps {
  id: number;
  done: number;
  valor: number;
  data: Date;
  categoria: string;
  value: string;
}

export default function App() {
  const [db, setDb] = useState(SQLite.openDatabase("example.db"));
  const [categorys, setCategorys] = useState<DropdownItensProps[] | []>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [amount, setAmount] = useState<null | string>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<SQLItensProps[]>([]);

  Moment.locale("pt-BR");

  const loadCategories = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "select * from categoria;",
        null,
        (_, { rows: { _array } }: SQLProps) => {
          console.log(_array);
          setCategorys(_array);
        }
      );
    });
  };

  const loadExpenses = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "select * from despesas;",
        null,
        (_, { rows: { _array } }: { rows: { _array: SQLItensProps[] } }) => {
          setExpenses(_array);
        }
      );
    });
  };

  const clearInputs = useCallback(() => {
    setSelectedCategory(null);
    setAmount(null);
    setCategory(null);
    setDescription(null);
  }, []);

  useEffect(() => {
    db.transaction((tx) => {
      //tx.executeSql(
      //  "drop table despesas;"
      //);
      tx.executeSql(
        "create table if not exists despesas (id integer primary key not null, done int, value text, valor integer, data date, categoria text);"
      );
      // tx.executeSql("drop table categoria;");
      // tx.executeSql("drop table despesas;");
      tx.executeSql(
        "create table if not exists categoria (label text, value text);"
      );
      loadCategories();
      loadExpenses();
    });
  }, []);

  const addNewPantry = () => {
    if (
      amount === null ||
      amount === "" ||
      description === null ||
      description === "" ||
      selectedCategory === null ||
      selectedCategory === ""
    ) {
      return false;
    }

    const currentDate = new Date().toISOString();
    db.transaction(
      (tx) => {
        tx.executeSql(
          `insert into despesas (done, value, valor,categoria ,data) values (?, ?, ?, ?, ?)`,
          [0, description, amount, selectedCategory, currentDate],
          (_, { rows }) => {
            console.log("DISPESA ADICIONADO COM SUCESSO");
            clearInputs();
            loadExpenses();
          }
        );
      },
      (e) => {
        console.log(e);
      }
    );
  };

  const addNewCategory = () => {
    if (category === null || category === "") {
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql(
          "insert into categoria (label, value) values (?, ?)",
          [category, category],
          (_, { rows }) => {
            //console.log("insert into categoria (label, value) values (?, ?)", rows._array);
            console.log("ADICIONADO COM SUCESSO");
            loadCategories();
          }
        );
        tx.executeSql(
          "select * from categoria",
          [],
          (_, { rows }: SQLProps) => {
            //console.log("select * from categoria", rows._array);
          }
        );
      },
      (e) => {
        console.log(e);
      }
    );
  };

  if (Platform.OS === "web") {
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={styles.heading}>Expo SQlite is not supported on web!</Text>
    </View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Controle Financeiro Fácil</Text>
      <ScrollView style={{ width: "100%", height: 400 }}>
        {expenses?.map((item, index) => (
          <View
            key={index}
            style={{ width: "100%", flexDirection: "row", gap: 10 }}
          >
            <Text>ID: {item.id}</Text>
            <Text>Valor: {item.valor}</Text>
            <Text>Descrição: {item.value}</Text>
            <Text>Categoria: {item.categoria}</Text>
          </View>
        ))}
      </ScrollView>

      <>
        <View
          style={{
            gap: 10,
            paddingHorizontal: 10,
            paddingTop: 10,
            paddingBottom: 30,
          }}
        >
          <DropDownPicker
            open={open}
            value={selectedCategory}
            items={categorys}
            setOpen={setOpen}
            setValue={setSelectedCategory}
            language="PT"
            style={styles.inputDrop}
          />
          <TextInput
            onChangeText={(valor) => setAmount(valor)}
            placeholder="Valor (R$)"
            style={styles.input}
            value={amount}
            keyboardType="numeric"
          />
          <TextInput
            onChangeText={(text) => setDescription(text)}
            placeholder="Descrição"
            style={styles.input}
            value={description}
          />

          <Button
            title="Adicionar Despesa"
            onPress={addNewPantry}
            disabled={!selectedCategory || !description || !amount}
          />

          <TextInput
            placeholder="Categoria"
            onChangeText={(text) => setCategory(text)}
            value={category}
            style={styles.input}
          />

          <Button title="Adicionar Categoria" onPress={addNewCategory} />
        </View>
      </>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 10,
  },
  flexRow: {
    flexDirection: "row",
  },
  input: {
    borderColor: "#4630eb",
    borderRadius: 4,
    borderWidth: 1,
    height: 48,
    paddingLeft: 10,
  },
  inputDrop: {
    borderColor: "#4630eb",
    borderRadius: 4,
    modalContentContainerStyle: {
      borderColor: "#4630eb",
    },
  },
  listArea: {
    backgroundColor: "#f0f0f0",
    flex: 1,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
});
