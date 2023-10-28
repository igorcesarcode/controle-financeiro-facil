import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
import Moment from "moment";
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

Moment.locale("pt-BR");
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
  value: number;
}

export default function App() {
  //Responsável pelo db
  const [db, _] = useState(SQLite.openDatabase("example.db"));
  //Responsável pelo gerenciamento do Dropdown
  const [categorys, setCategorys] = useState<DropdownItensProps[] | []>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  //Responsável pelas listagens
  const [expenses, setExpenses] = useState<SQLItensProps[] | []>([]);

  //Responsável pelos inputs
  const [amount, setAmount] = useState<null | string>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  //TODO: tratamento de formulario https://react-hook-form.com/

  //TODO: tratamento de shema https://zod.dev/

  //TODO: resolvers para formulario com o zod https://www.npmjs.com/package/@hookform/resolvers

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

  const startTable = useCallback(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists despesas (id integer primary key not null, done int, value text, valor integer, data date, categoria text);"
      );
      tx.executeSql(
        "create table if not exists categoria (label text, value text);"
      );
    });
  }, []);

  const clearRecords = useCallback(() => {
    db.transaction((tx) => {
      tx.executeSql("DELETE FROM categoria;");
      tx.executeSql("DELETE FROM despesas;");
    });
    setExpenses([]);
    setCategorys([]);
    setSelectedCategory(null);
  }, []);

  const updateItemDone = (id: number, done: number) => {
    db.transaction((tx) => {
      //TODO: COMANDO PARA ATUALIZAR O ITEM ATUAL
      tx.executeSql("UPDATE", [done, id], (_, { rows }) => {
        loadCategories();
      });
    });
  };

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
            setCategory(null);
          }
        );
      },
      (e) => {
        console.log(e);
      }
    );
  };

  useEffect(() => {
    startTable();
    loadCategories();
    loadExpenses();
  }, []);

  if (Platform.OS === "web") {
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={styles.heading}>Expo SQlite is not supported on web!</Text>
    </View>;
  }

  const renderItem = useCallback(
    ({ item }) => {
      return (
        <TouchableOpacity
          onPress={() => {
            updateItemDone(item.id, item.dode === 0 ? 1 : 0);
          }}
          style={{
            backgroundColor: item.done ? "#1c9963" : "#fff",
            borderColor: "#000",
            borderWidth: 1,
            padding: 8,
          }}
        >
          <View style={{ width: "100%", flexDirection: "row", gap: 10 }}>
            <Text>Descrição: {item.value}</Text>
            <Text>Data: {Moment(item.data).format("DD/MM/yyyy")}</Text>

            <Text>
              {item.valor.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Text>

            <Text>Categoria: {item.categoria}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [expenses]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Controle Financeiro Fácil</Text>

      <FlatList
        data={expenses}
        keyExtractor={({ id }) => String(id)}
        renderItem={renderItem}
      />

      <>
        <View style={styles.form}>
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
          <Button title="Limpar Registros" onPress={clearRecords} />
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
  form: {
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 30,
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
